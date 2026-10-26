import type { DetectedObject, EvidenceProvenance, SpatialFinding } from '@/types/ai';
import type { SafetyAnalysis } from './schemas';
import { analyzeSpatialRelationships } from './spatialAnalyzer';

export function assignDetectionsToPhoto(
  detections: SafetyAnalysis['detectedObjects'],
  photoId: string,
  scanId = photoId,
  provenance?: EvidenceProvenance
): DetectedObject[] {
  return detections.map((detection, index) => ({
    ...detection,
    id: `observation-${scanId}-${photoId}-${index}`,
    imageId: photoId,
    provenance,
  }));
}

export function analyzePhotoRelationships(
  objects: DetectedObject[],
  photoId: string,
  scanId = photoId,
  provenance?: EvidenceProvenance
): SpatialFinding[] {
  return analyzeSpatialRelationships(objects).map((finding, index) => ({
    ...finding,
    id: `relation-${scanId}-${photoId}-${index}`,
    imageId: photoId,
    provenance,
  }));
}
