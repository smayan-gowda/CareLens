import type { Hazard, ScanPhoto, ScanResult, SpatialFinding } from '@/types/ai';

export type ComparisonFindingStatus =
  | 'still_reported'
  | 'possibly_changed'
  | 'uncertain_view'
  | 'newly_detected';

export interface AssessmentComparisonFinding {
  id: string;
  kind: 'hazard' | 'spatial';
  title: string;
  detail: string;
  beforeEvidence?: string;
  afterEvidence?: string;
  status: ComparisonFindingStatus;
  beforeImageId?: string;
  afterImageId?: string;
  matchedFindingId?: string;
}

export interface AssessmentComparisonPhoto extends ScanPhoto {
  image: string;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hazardKey(hazard: Hazard): string {
  const title = normalize(hazard.title);
  if (!title) return `hazard:${normalize(hazard.category)}:unmatched:${hazard.id}`;
  return `hazard:${normalize(hazard.category)}:${title}`;
}

function spatialKey(finding: SpatialFinding): string {
  const objects = finding.objectsInvolved.map(normalize).filter(Boolean).sort();
  if (objects.length === 0) return `spatial:${finding.relationType}:unmatched:${finding.id}`;
  return `spatial:${finding.relationType}:${objects.join('|')}`;
}

function photoId(
  imageId: string | undefined,
  images: AssessmentComparisonPhoto[]
): string | undefined {
  if (imageId && images.some((photo) => photo.id === imageId)) return imageId;
  return images[0]?.id;
}

function photoForImage(
  imageId: string | undefined,
  images: AssessmentComparisonPhoto[]
): AssessmentComparisonPhoto | undefined {
  return images.find((photo) => photo.id === imageId);
}

function isSameGuidedView(
  beforeImageId: string | undefined,
  afterImageId: string | undefined,
  beforePhotos: AssessmentComparisonPhoto[],
  afterPhotos: AssessmentComparisonPhoto[]
): boolean {
  const before = photoForImage(beforeImageId, beforePhotos);
  const after = photoForImage(afterImageId, afterPhotos);
  return Boolean(before && after && before.role === after.role && normalize(before.label) === normalize(after.label));
}

function describeHazard(hazard: Hazard): string {
  return hazard.visibleObservation ?? hazard.description;
}

function describeSpatialFinding(finding: SpatialFinding): string {
  return finding.geometricEvidence;
}

function toComparisonPhotos(scan: ScanResult): AssessmentComparisonPhoto[] {
  return scan.images.map((image, index) => ({
    ...(scan.photos?.[index] ?? {
      id: `legacy-photo-${scan.id}-${index}`,
      role: index === 0 ? 'overview' : 'detail',
      label: index === 0 ? 'Room overview' : `Photo ${index + 1}`,
    }),
    image,
  }));
}

export function compareAssessments(
  before: ScanResult,
  after: ScanResult
): {
  findings: AssessmentComparisonFinding[];
  beforePhotos: AssessmentComparisonPhoto[];
  afterPhotos: AssessmentComparisonPhoto[];
} {
  const beforePhotos = toComparisonPhotos(before);
  const afterPhotos = toComparisonPhotos(after);

  const earlierFindings = [
    ...before.hazards
      .filter((hazard) => hazard.feedback !== 'not_present')
      .map((hazard) => ({
        id: hazard.id,
        kind: 'hazard' as const,
        title: hazard.title,
        detail: describeHazard(hazard),
        imageId: photoId(hazard.imageId, beforePhotos),
        key: hazardKey(hazard),
      })),
    ...(before.spatialFindings ?? [])
      .filter((finding) => finding.reviewStatus !== 'disputed')
      .map((finding) => ({
        id: finding.id,
        kind: 'spatial' as const,
        title: finding.relationType.replaceAll('-', ' '),
        detail: describeSpatialFinding(finding),
        imageId: photoId(finding.imageId, beforePhotos),
        key: spatialKey(finding),
      })),
  ];

  const laterFindings = [
    ...after.hazards
      .filter((hazard) => hazard.feedback !== 'not_present')
      .map((hazard) => ({
        id: hazard.id,
        kind: 'hazard' as const,
        title: hazard.title,
        detail: describeHazard(hazard),
        imageId: photoId(hazard.imageId, afterPhotos),
        key: hazardKey(hazard),
      })),
    ...(after.spatialFindings ?? [])
      .filter((finding) => finding.reviewStatus !== 'disputed')
      .map((finding) => ({
        id: finding.id,
        kind: 'spatial' as const,
        title: finding.relationType.replaceAll('-', ' '),
        detail: describeSpatialFinding(finding),
        imageId: photoId(finding.imageId, afterPhotos),
        key: spatialKey(finding),
      })),
  ];

  const remainingLater = [...laterFindings];
  const findings = earlierFindings.map((earlier): AssessmentComparisonFinding => {
    const matchingIndex = remainingLater.findIndex((later) => later.key === earlier.key);
    if (matchingIndex >= 0) {
      const [later] = remainingLater.splice(matchingIndex, 1);
      const sameGuidedView = isSameGuidedView(
        earlier.imageId,
        later.imageId,
        beforePhotos,
        afterPhotos
      );
      return {
        id: `comparison:${earlier.kind}:${earlier.id}`,
        kind: earlier.kind,
        title: earlier.title,
        detail: sameGuidedView
          ? later.detail
          : `${later.detail} A similarly described finding appears in a different guided photo view; it may be a separate object or a framing difference. Review both images before treating these as the same condition.`,
        beforeEvidence: earlier.detail,
        afterEvidence: later.detail,
        status: sameGuidedView ? 'still_reported' : 'uncertain_view',
        beforeImageId: earlier.imageId,
        afterImageId: later.imageId,
        matchedFindingId: later.id,
      };
    }

    const sameViewPhoto = beforePhotos
      .filter((photo) => photo.id === earlier.imageId)
      .map((beforePhoto) =>
        afterPhotos.find(
          (afterPhoto) =>
            beforePhoto.role === afterPhoto.role &&
            normalize(beforePhoto.label) === normalize(afterPhoto.label)
        )
      )[0];
    const afterImageId = sameViewPhoto?.id ?? afterPhotos[0]?.id;

    return {
      id: `comparison:${earlier.kind}:${earlier.id}`,
      kind: earlier.kind,
      title: earlier.title,
      detail: sameViewPhoto
        ? `${earlier.detail} Not detected in the follow-up scan using the same guided photo label; review both images.`
        : `${earlier.detail} The follow-up photo does not have a matching guided view label.`,
      status:
        sameViewPhoto && isSameGuidedView(earlier.imageId, sameViewPhoto.id, beforePhotos, afterPhotos)
          ? 'possibly_changed'
          : 'uncertain_view',
      beforeEvidence: earlier.detail,
      beforeImageId: earlier.imageId,
      afterImageId,
    };
  });

  findings.push(
    ...remainingLater.map((later) => ({
      id: `comparison:${later.kind}:${later.id}`,
      kind: later.kind,
      title: later.title,
      detail: later.detail,
      afterEvidence: later.detail,
      status: 'newly_detected' as const,
      beforeImageId: beforePhotos[0]?.id,
      afterImageId: later.imageId,
      matchedFindingId: later.id,
    }))
  );

  return { findings, beforePhotos, afterPhotos };
}
