import { describe, expect, it } from 'vitest';
import { parseRealPhotoEvaluationManifest } from './realPhotoEval';

describe('real-photo evaluation manifest', () => {
  it('accepts an empty manifest without treating it as real-world evidence', () => {
    expect(parseRealPhotoEvaluationManifest({ schemaVersion: 1, cases: [] }).cases).toEqual([]);
  });

  it('requires documented rights, independent annotations, and captured detector metadata', () => {
    const invalidCase = {
      id: 'photo-1',
      imagePath: 'eval-data/real-photos/photo-1.jpg',
      imageSha256: 'a'.repeat(64),
      roomType: 'bedroom',
      cameraAngle: 'eye-level overview',
      lighting: 'bright daylight',
      difficulty: 'mild occlusion',
      provenance: {
        sourceType: 'user-consented',
        sourceReference: 'consent-record-1',
        rightsConfirmed: true,
      },
      annotation: { independentReviewerCount: 1, reviewedAt: '2026-10-20' },
      detector: { model: 'vision-v1', capturedAt: '2026-10-20' },
      groundTruthObjects: [],
      detectedObjects: [],
      expectedRelations: [],
    };

    expect(() =>
      parseRealPhotoEvaluationManifest({ schemaVersion: 1, cases: [invalidCase] })
    ).toThrow('at least two independent annotation reviewers');
  });
});
