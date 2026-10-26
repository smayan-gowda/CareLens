import { describe, expect, it } from 'vitest';
import type { ScanResult } from '@/types/ai';
import { compareAssessments } from './assessmentComparison';

function scan(
  id: string,
  overrides: Partial<ScanResult> = {}
): ScanResult {
  const photoId = `${id}-overview`;
  return {
    id,
    roomId: 'room-1',
    homeId: 'home-1',
    images: [`/${id}.jpg`],
    photos: [{ id: photoId, role: 'overview', label: 'Room overview' }],
    status: 'Completed',
    createdAt: '2026-10-01T12:00:00.000Z',
    safetyScore: 80,
    hazards: [],
    recommendations: [],
    ...overrides,
  };
}

describe('compareAssessments', () => {
  it('marks the same finding label as still reported without implying physical-object identity', () => {
    const before = scan('before', {
      hazards: [{
        id: 'old-hazard',
        title: 'Loose rug',
        category: 'Trip Hazard',
        severity: 'Medium',
        confidence: 0.8,
        description: 'A loose rug may catch a foot.',
        location: 'Floor',
        impact: 'Potential trip',
        imageId: 'before-overview',
      }],
    });
    const after = scan('after', {
      hazards: [{
        id: 'new-hazard',
        title: 'Loose rug',
        category: 'Trip Hazard',
        severity: 'Low',
        confidence: 0.7,
        description: 'A rug edge is visible.',
        location: 'Floor',
        impact: 'Potential trip',
        imageId: 'after-overview',
      }],
    });

    const result = compareAssessments(before, after);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      status: 'still_reported',
      beforeImageId: 'before-overview',
      afterImageId: 'after-overview',
      matchedFindingId: 'new-hazard',
    });
  });

  it('labels a missing finding as possibly changed only for the same guided photo role and label', () => {
    const before = scan('before', {
      hazards: [{
        id: 'old-hazard',
        title: 'Loose rug',
        category: 'Trip Hazard',
        severity: 'Medium',
        confidence: 0.8,
        description: 'A loose rug may catch a foot.',
        location: 'Floor',
        impact: 'Potential trip',
        imageId: 'before-overview',
      }],
    });

    expect(compareAssessments(before, scan('after')).findings[0].status).toBe('possibly_changed');
    expect(
      compareAssessments(
        before,
        scan('after', {
          photos: [{ id: 'after-entry', role: 'detail', label: 'Doorway & entrance' }],
        })
      ).findings[0].status
    ).toBe('uncertain_view');
  });

  it('does not treat similarly worded findings in different guided views as the same condition', () => {
      const before = scan('before', {
        hazards: [{
          id: 'old-hazard',
          title: 'Loose rug',
          category: 'Trip Hazard',
          severity: 'Medium',
          confidence: 0.8,
          description: 'A loose rug may catch a foot.',
          location: 'Floor',
          impact: 'Potential trip',
          imageId: 'before-overview',
        }],
      });
      const after = scan('after', {
        photos: [{ id: 'after-entry', role: 'detail', label: 'Doorway & entrance' }],
        hazards: [{
          id: 'new-hazard',
          title: 'Loose rug',
          category: 'Trip Hazard',
          severity: 'Medium',
          confidence: 0.8,
          description: 'A loose rug may catch a foot.',
          location: 'Floor',
          impact: 'Potential trip',
          imageId: 'after-entry',
        }],
      });

      expect(compareAssessments(before, after).findings[0]).toMatchObject({
        status: 'uncertain_view',
        beforeImageId: 'before-overview',
        afterImageId: 'after-entry',
        matchedFindingId: 'new-hazard',
      });
  });

  it('reports follow-up-only findings separately', () => {
    const result = compareAssessments(
      scan('before'),
      scan('after', {
        hazards: [{
          id: 'new-hazard',
          title: 'Blocked doorway',
          category: 'Blocked Exit',
          severity: 'High',
          confidence: 0.9,
          description: 'Objects are visible near the doorway.',
          location: 'Entrance',
          impact: 'May impede passage',
          imageId: 'after-overview',
        }],
      })
    );
    expect(result.findings[0]).toMatchObject({
      status: 'newly_detected',
      matchedFindingId: 'new-hazard',
    });
  });

  it('preserves scan photos when neither assessment has active findings', () => {
    const result = compareAssessments(scan('before'), scan('after'));
    expect(result.findings).toEqual([]);
    expect(result.beforePhotos[0].image).toBe('/before.jpg');
    expect(result.afterPhotos[0].image).toBe('/after.jpg');
  });
});
