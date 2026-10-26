import { describe, expect, it } from 'vitest';
import { analyzePhotoRelationships, assignDetectionsToPhoto } from './photoEvidence';

describe('photo-scoped evidence', () => {
  it('keeps detections and spatial findings tied to the source photo', () => {
    const doorway = assignDetectionsToPhoto(
      [
        {
          name: 'Doorway',
          confidence: 90,
          boundingBox: { x: 10, y: 20, width: 20, height: 45 },
        },
      ],
      'overview',
      'scan-1',
      { origin: 'vision-model', createdAt: '2026-01-01T00:00:00.000Z' }
    );
    const obstacle = assignDetectionsToPhoto(
      [
        {
          name: 'Box',
          confidence: 90,
          boundingBox: { x: 31, y: 30, width: 12, height: 20 },
        },
      ],
      'doorway-close-up'
    );

    expect(doorway[0].imageId).toBe('overview');
    expect(doorway[0].id).toBe('observation-scan-1-overview-0');
    expect(doorway[0].provenance?.origin).toBe('vision-model');
    expect(obstacle[0].imageId).toBe('doorway-close-up');
    expect(analyzePhotoRelationships(doorway, 'overview')).toEqual([]);
    expect(analyzePhotoRelationships(obstacle, 'doorway-close-up')).toEqual([]);

    const sameViewRelationship = analyzePhotoRelationships(
      [...doorway, ...obstacle].map((object) => ({ ...object, imageId: 'same-photo' })),
      'same-photo',
      'scan-1',
      { origin: 'spatial-engine', createdAt: '2026-01-01T00:00:00.000Z' }
    );
    expect(sameViewRelationship).toHaveLength(1);
    expect(sameViewRelationship[0].imageId).toBe('same-photo');
    expect(sameViewRelationship[0].id).toBe('relation-scan-1-same-photo-0');
    expect(sameViewRelationship[0].provenance?.origin).toBe('spatial-engine');
  });
});
