import type {
  DetectedObject,
  EvidenceProvenance,
  Hazard,
  Recommendation,
  SpatialFinding,
} from '@/types/ai';

function normalizedName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function namesMatch(first: string, second: string): boolean {
  const a = normalizedName(first);
  const b = normalizedName(second);
  return a.length > 0 && b.length > 0 && (a === b || a.includes(b) || b.includes(a));
}

function linkedObjects(
  names: string[] | undefined,
  objects: DetectedObject[],
  imageId: string | undefined
): DetectedObject[] {
  if (!names?.length) return [];
  return objects.filter(
    (object) =>
      object.imageId === imageId &&
      names.some((name) => namesMatch(name, object.name))
  );
}

function linkedRelations(
  objects: DetectedObject[],
  findings: SpatialFinding[],
  imageId: string | undefined
): SpatialFinding[] {
  const observationIds = new Set(objects.map((object) => object.id));
  return findings.filter(
    (finding) =>
      finding.imageId === imageId &&
      finding.objectIds.length > 0 &&
      finding.objectIds.every((id) => observationIds.has(id))
  );
}

export function linkHazardEvidence(
  hazards: Hazard[],
  objects: DetectedObject[],
  findings: SpatialFinding[],
  provenance: EvidenceProvenance
): Hazard[] {
  return hazards.map((hazard) => {
    const observations = linkedObjects(hazard.objectsInvolved, objects, hazard.imageId);
    const relations = linkedRelations(observations, findings, hazard.imageId);
    return {
      ...hazard,
      provenance,
      observationIds: observations.map((object) => object.id),
      spatialFindingIds: relations.map((finding) => finding.id),
    };
  });
}

export function linkRecommendationEvidence(
  recommendations: Recommendation[],
  hazards: Hazard[],
  objects: DetectedObject[],
  findings: SpatialFinding[],
  provenance: EvidenceProvenance
): Recommendation[] {
  return recommendations.map((recommendation) => {
    const observations = linkedObjects(
      recommendation.objectsInvolved,
      objects,
      recommendation.imageId
    );
    const relations = linkedRelations(observations, findings, recommendation.imageId);
    const observationIds = new Set(observations.map((object) => object.id));
    const relatedHazards = hazards.filter(
      (hazard) =>
        hazard.imageId === recommendation.imageId &&
        hazard.observationIds?.some((id) => observationIds.has(id))
    );

    return {
      ...recommendation,
      provenance,
      observationIds: [...observationIds],
      spatialFindingIds: relations.map((finding) => finding.id),
      evidencePhotoIds: recommendation.imageId ? [recommendation.imageId] : [],
      relatedHazardIds: relatedHazards.map((hazard) => hazard.id),
    };
  });
}
