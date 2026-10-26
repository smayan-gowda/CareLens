import type { DetectedObject, SpatialEvidenceStatus, SpatialRelationType } from '@/types/ai';
import type { ExpectedSpatialRelation, SpatialEvaluationCase } from './evalDataset';

export interface RealPhotoEvaluationCase extends SpatialEvaluationCase {
  imagePath: string;
  imageSha256: string;
  provenance: {
    sourceType: 'user-consented' | 'licensed-public';
    sourceReference: string;
    rightsConfirmed: true;
  };
  annotation: {
    independentReviewerCount: number;
    reviewedAt: string;
  };
  detector: {
    model: string;
    capturedAt: string;
  };
}

export interface RealPhotoEvaluationManifest {
  schemaVersion: 1;
  cases: RealPhotoEvaluationCase[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateObjects(
  value: unknown,
  fieldName: string,
  requireValidBoxes: boolean
): DetectedObject[] {
  if (!Array.isArray(value)) throw new Error(`${fieldName} must be an array.`);
  for (const object of value) {
    if (
      !isRecord(object) ||
      typeof object.id !== 'string' ||
      typeof object.name !== 'string' ||
      typeof object.confidence !== 'number' ||
      !Number.isFinite(object.confidence)
    ) {
      throw new Error(`${fieldName} contains an invalid object record.`);
    }
    if (object.boundingBox !== undefined) {
      const box = object.boundingBox;
      if (
        !isRecord(box) ||
        !['x', 'y', 'width', 'height'].every(
          (key) => typeof box[key] === 'number' && Number.isFinite(box[key])
        )
      ) {
        throw new Error(`${fieldName} contains an invalid bounding box.`);
      }
      const { x, y, width, height } = box as Record<string, number>;
      if (
        x < 0 || y < 0 || width <= 0 || height <= 0 ||
        x + width > 100 || y + height > 100
      ) {
        throw new Error(`${fieldName} boxes must fit normalized 0-100 image coordinates.`);
      }
    } else if (requireValidBoxes) {
      throw new Error(`${fieldName} requires a labeled bounding box for every object.`);
    }
  }
  return value as DetectedObject[];
}

const relationTypes: SpatialRelationType[] = [
  'proximity',
  'overlap',
  'duplicate-detection',
  'walkway-overlap',
  'doorway-proximity',
  'obstacle-destination',
];
const evidenceStatuses: SpatialEvidenceStatus[] = [
  'Observed',
  'Geometrically Supported',
  'Potential Concern',
  'Needs Review',
  'Physically Unverified',
];

export function parseRealPhotoEvaluationManifest(value: unknown): RealPhotoEvaluationManifest {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.cases)) {
    throw new Error('Real-photo evaluation manifest must use schemaVersion 1 and contain a cases array.');
  }

  const cases = value.cases.map((entry, index): RealPhotoEvaluationCase => {
    const label = `Real-photo case ${index + 1}`;
    if (!isRecord(entry)) throw new Error(`${label} must be an object.`);
    if (
      typeof entry.id !== 'string' ||
      typeof entry.imagePath !== 'string' ||
      typeof entry.imageSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(entry.imageSha256) ||
      typeof entry.roomType !== 'string' ||
      !entry.roomType.trim() ||
      typeof entry.cameraAngle !== 'string' ||
      !entry.cameraAngle.trim() ||
      typeof entry.lighting !== 'string' ||
      !entry.lighting.trim() ||
      typeof entry.difficulty !== 'string' ||
      !entry.difficulty.trim()
    ) {
      throw new Error(`${label} must include an id, imagePath, and 64-character imageSha256.`);
    }
    if (
      !isRecord(entry.provenance) ||
      !['user-consented', 'licensed-public'].includes(String(entry.provenance.sourceType)) ||
      typeof entry.provenance.sourceReference !== 'string' ||
      !entry.provenance.sourceReference.trim() ||
      entry.provenance.rightsConfirmed !== true
    ) {
      throw new Error(`${label} must document image provenance and confirmed evaluation rights.`);
    }
    if (
      !isRecord(entry.annotation) ||
      typeof entry.annotation.independentReviewerCount !== 'number' ||
      entry.annotation.independentReviewerCount < 2 ||
      typeof entry.annotation.reviewedAt !== 'string' ||
      !entry.annotation.reviewedAt.trim()
    ) {
      throw new Error(`${label} requires at least two independent annotation reviewers.`);
    }
    if (
      !isRecord(entry.detector) ||
      typeof entry.detector.model !== 'string' ||
      !entry.detector.model.trim() ||
      typeof entry.detector.capturedAt !== 'string'
    ) {
      throw new Error(`${label} must identify the captured detector model and timestamp.`);
    }
    if (!Array.isArray(entry.expectedRelations)) {
      throw new Error(`${label} must include labeled expectedRelations.`);
    }

    const groundTruthObjects = validateObjects(
      entry.groundTruthObjects,
      `${label}.groundTruthObjects`,
      true
    );
    const detectedObjects = validateObjects(
      entry.detectedObjects,
      `${label}.detectedObjects`,
      false
    );
    const groundTruthIds = new Set(groundTruthObjects.map((object) => object.id));
    const expectedRelations = entry.expectedRelations.map((relation): ExpectedSpatialRelation => {
      if (
        !isRecord(relation) ||
        typeof relation.relationType !== 'string' ||
        !relationTypes.includes(relation.relationType as SpatialRelationType) ||
        !Array.isArray(relation.objectIds) ||
        relation.objectIds.length !== 2 ||
        !relation.objectIds.every((id) => typeof id === 'string' && groundTruthIds.has(id)) ||
        typeof relation.evidenceStatus !== 'string' ||
        !evidenceStatuses.includes(relation.evidenceStatus as SpatialEvidenceStatus)
      ) {
        throw new Error(`${label} contains an invalid or unlabeled expected relation.`);
      }
      return {
        relationType: relation.relationType as SpatialRelationType,
        objectIds: relation.objectIds as string[],
        evidenceStatus: relation.evidenceStatus as SpatialEvidenceStatus,
      };
    });

    return {
      id: entry.id,
      imagePath: entry.imagePath,
      imageSha256: entry.imageSha256,
      roomType: entry.roomType,
      cameraAngle: entry.cameraAngle,
      lighting: entry.lighting,
      difficulty: entry.difficulty,
      groundTruthObjects,
      detectedObjects,
      expectedRelations,
      provenance: {
        sourceType: entry.provenance.sourceType as RealPhotoEvaluationCase['provenance']['sourceType'],
        sourceReference: entry.provenance.sourceReference,
        rightsConfirmed: true,
      },
      annotation: {
        independentReviewerCount: entry.annotation.independentReviewerCount,
        reviewedAt: entry.annotation.reviewedAt,
      },
      detector: {
        model: entry.detector.model,
        capturedAt: entry.detector.capturedAt,
      },
    };
  });

  return { schemaVersion: 1, cases };
}
