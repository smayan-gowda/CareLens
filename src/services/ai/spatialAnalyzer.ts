import type {
  BoundingBox,
  DetectedObject,
  SpatialEvidenceStatus,
  SpatialFinding,
  SpatialRelationType,
} from '@/types/ai';

const PROXIMITY_THRESHOLD = 6;
const DOORWAY_PROXIMITY_THRESHOLD = 4;
const MIN_CONFIDENCE_FOR_CONCERN = 75;
const BASE_LIMITATIONS =
  'Image-coordinate relationships do not establish real-world distance, physical clearance, or whether an item blocks movement.';

interface PositionedObject {
  object: DetectedObject;
  box: BoundingBox;
}

function isValidBox(box: BoundingBox | undefined): box is BoundingBox {
  return Boolean(
    box &&
      Number.isFinite(box.x) &&
      Number.isFinite(box.y) &&
      Number.isFinite(box.width) &&
      Number.isFinite(box.height) &&
      box.x >= 0 &&
      box.y >= 0 &&
      box.width > 0 &&
      box.height > 0 &&
      box.x + box.width <= 100 &&
      box.y + box.height <= 100
  );
}

function normalizedName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function intersectionArea(a: BoundingBox, b: BoundingBox): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function overlapRatio(a: BoundingBox, b: BoundingBox): number {
  const smallerArea = Math.min(a.width * a.height, b.width * b.height);
  return smallerArea > 0 ? intersectionArea(a, b) / smallerArea : 0;
}

function edgeGap(a: BoundingBox, b: BoundingBox): number {
  const horizontal = Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width));
  const vertical = Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height));
  return Math.hypot(horizontal, vertical);
}

function isWalkway(name: string): boolean {
  return /\b(walkway|walking path|pathway|walking area)\b/.test(normalizedName(name));
}

function isDoorway(name: string): boolean {
  return /\b(door|doorway|entrance|entryway|exit)\b/.test(normalizedName(name));
}

function isObstacle(name: string): boolean {
  return /\b(cord|cable|rug|mat|clutter|box|bag|basket)\b/.test(normalizedName(name));
}

function isDestination(name: string): boolean {
  return /\b(bed|toilet|sink|chair|seating|door|doorway|entrance|exit)\b/.test(
    normalizedName(name)
  );
}

function confidenceOf(objects: PositionedObject[], multiplier = 0.8): number {
  const detectorConfidence = Math.min(
    ...objects.map(({ object }) =>
      Number.isFinite(object.confidence) ? object.confidence : 0
    )
  );
  return Math.round(Math.max(0, Math.min(100, detectorConfidence)) * multiplier);
}

function createFinding(
  relationType: SpatialRelationType,
  objects: PositionedObject[],
  geometricEvidence: string,
  evidenceStatus: SpatialEvidenceStatus,
  confidenceMultiplier = 0.8
): SpatialFinding {
  const objectIds = objects.map(({ object }) => object.id);
  const stableIds = [...objectIds].sort();
  return {
    id: `spatial-${relationType}-${stableIds.join('-')}`,
    relationType,
    objectsInvolved: objects.map(({ object }) => object.name),
    objectIds,
    geometricEvidence,
    confidence: confidenceOf(objects, confidenceMultiplier),
    evidenceStatus,
    limitations: BASE_LIMITATIONS,
  };
}

function boxEvidence(objects: PositionedObject[]): string {
  const boxes = objects
    .map(({ object, box }) => `${object.name} [${box.x}, ${box.y}, ${box.width}, ${box.height}]`)
    .join('; ');
  return `Normalized image-coordinate boxes (0-100): ${boxes}.`;
}

export function analyzeSpatialRelationships(detectedObjects: DetectedObject[]): SpatialFinding[] {
  const positioned = detectedObjects
    .filter((object): object is DetectedObject & { boundingBox: BoundingBox } =>
      isValidBox(object.boundingBox)
    )
    .map((object) => ({ object, box: object.boundingBox }));
  const findings: SpatialFinding[] = [];

  for (let i = 0; i < positioned.length; i++) {
    for (let j = i + 1; j < positioned.length; j++) {
      const a = positioned[i];
      const b = positioned[j];
      const overlap = overlapRatio(a.box, b.box);
      const gap = edgeGap(a.box, b.box);
      const sameLabel = normalizedName(a.object.name) === normalizedName(b.object.name);

      if (sameLabel && overlap >= 0.8) {
        findings.push(
          createFinding(
            'duplicate-detection',
            [a, b],
            `${boxEvidence([a, b])} Same normalized label and ${Math.round(overlap * 100)}% overlap of the smaller box; possible duplicate detections.`,
            'Needs Review',
            0.65
          )
        );
        continue;
      }

      const aIsWalkway = isWalkway(a.object.name);
      const bIsWalkway = isWalkway(b.object.name);
      if (aIsWalkway !== bIsWalkway) {
        const [walkway, other] = aIsWalkway ? [a, b] : [b, a];
        if (isDoorway(other.object.name)) continue;
        const pathOverlap = overlapRatio(walkway.box, other.box);
        if (pathOverlap >= 0.15) {
          const confident =
            walkway.object.confidence >= MIN_CONFIDENCE_FOR_CONCERN &&
            other.object.confidence >= MIN_CONFIDENCE_FOR_CONCERN;
          findings.push(
            createFinding(
              'walkway-overlap',
              [walkway, other],
              `${boxEvidence([walkway, other])} The detections overlap by ${Math.round(pathOverlap * 100)}% of the smaller box.`,
              confident ? 'Potential Concern' : 'Needs Review',
              confident ? 0.8 : 0.55
            )
          );
        }
        continue;
      }

      const aIsDoorway = isDoorway(a.object.name);
      const bIsDoorway = isDoorway(b.object.name);
      if (aIsDoorway !== bIsDoorway) {
        const [doorway, other] = aIsDoorway ? [a, b] : [b, a];
        if (overlap > 0 || gap <= DOORWAY_PROXIMITY_THRESHOLD) {
          const confident =
            overlap > 0 &&
            doorway.object.confidence >= MIN_CONFIDENCE_FOR_CONCERN &&
            other.object.confidence >= MIN_CONFIDENCE_FOR_CONCERN;
          findings.push(
            createFinding(
              'doorway-proximity',
              [doorway, other],
              `${boxEvidence([doorway, other])} ${overlap > 0 ? `The detections overlap by ${Math.round(overlap * 100)}% of the smaller box.` : `The boxes are ${gap.toFixed(1)} image-coordinate percentage points apart.`}`,
              confident ? 'Potential Concern' : 'Needs Review',
              confident ? 0.8 : 0.55
            )
          );
        }
        continue;
      }

      const aIsObstacle = isObstacle(a.object.name);
      const bIsObstacle = isObstacle(b.object.name);
      const aIsDestination = isDestination(a.object.name);
      const bIsDestination = isDestination(b.object.name);
      if (
        ((aIsObstacle && bIsDestination) || (bIsObstacle && aIsDestination)) &&
        gap <= PROXIMITY_THRESHOLD
      ) {
        findings.push(
          createFinding(
            'obstacle-destination',
            [a, b],
            `${boxEvidence([a, b])} The boxes ${overlap > 0 ? `overlap by ${Math.round(overlap * 100)}% of the smaller box` : `are ${gap.toFixed(1)} image-coordinate percentage points apart`}.`,
            'Needs Review',
            0.6
          )
        );
        continue;
      }

      if (aIsWalkway || bIsWalkway || aIsDoorway || bIsDoorway) continue;

      if (overlap > 0) {
        findings.push(
          createFinding(
            'overlap',
            [a, b],
            `${boxEvidence([a, b])} The detections overlap by ${Math.round(overlap * 100)}% of the smaller box; image overlap may reflect occlusion or detector imprecision.`,
            'Needs Review',
            0.65
          )
        );
      } else if (gap <= PROXIMITY_THRESHOLD) {
        findings.push(
          createFinding(
            'proximity',
            [a, b],
            `${boxEvidence([a, b])} The boxes are ${gap.toFixed(1)} image-coordinate percentage points apart; this is not a real-world distance estimate.`,
            'Geometrically Supported',
            0.7
          )
        );
      }
    }
  }

  return findings;
}
