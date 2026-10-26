import { describe, expect, it } from 'vitest';
import type { DetectedObject, Hazard, Recommendation, SpatialFinding } from '@/types/ai';
import { linkHazardEvidence, linkRecommendationEvidence } from './evidenceLinks';

const provenance = { origin: 'vision-model' as const, createdAt: '2026-01-01T00:00:00.000Z' };

const observations: DetectedObject[] = [
  { id: 'obs-1', name: 'Loose rug', confidence: 91, imageId: 'photo-a' },
  { id: 'obs-2', name: 'Bed', confidence: 88, imageId: 'photo-a' },
  { id: 'obs-other-photo', name: 'Loose rug', confidence: 91, imageId: 'photo-b' },
];

const relation: SpatialFinding = {
  id: 'relation-1',
  relationType: 'proximity',
  objectsInvolved: ['Loose rug', 'Bed'],
  objectIds: ['obs-1', 'obs-2'],
  geometricEvidence: 'The image boxes are near one another.',
  confidence: 60,
  evidenceStatus: 'Needs Review',
  limitations: 'Image coordinates only.',
  imageId: 'photo-a',
};

describe('evidence links', () => {
  it('links model hazards and recommendations only to labeled evidence in the same photo', () => {
    const hazard: Hazard = {
      id: 'hazard-1',
      title: 'Rug near bed',
      category: 'Trip Hazard',
      severity: 'Medium',
      confidence: 80,
      description: 'The rug may warrant review.',
      location: 'Beside the bed',
      impact: 'Possible trip concern',
      objectsInvolved: ['Rug', 'Bed'],
      imageId: 'photo-a',
    };
    const linkedHazard = linkHazardEvidence([hazard], observations, [relation], provenance)[0];
    expect(linkedHazard.observationIds).toEqual(['obs-1', 'obs-2']);
    expect(linkedHazard.spatialFindingIds).toEqual(['relation-1']);
    expect(linkedHazard.provenance).toEqual(provenance);

    const recommendation: Recommendation = {
      id: 'recommendation-1',
      title: 'Check rug placement',
      description: 'Review its placement in person.',
      priority: 'Medium',
      estimatedCost: 'Varies',
      difficulty: 'Easy',
      expectedImpact: 1,
      objectsInvolved: ['Loose rug', 'Bed'],
      imageId: 'photo-a',
    };
    const linkedRecommendation = linkRecommendationEvidence(
      [recommendation],
      [linkedHazard],
      observations,
      [relation],
      provenance
    )[0];

    expect(linkedRecommendation.observationIds).toEqual(['obs-1', 'obs-2']);
    expect(linkedRecommendation.spatialFindingIds).toEqual(['relation-1']);
    expect(linkedRecommendation.relatedHazardIds).toEqual(['hazard-1']);
    expect(linkedRecommendation.evidencePhotoIds).toEqual(['photo-a']);
  });

  it('does not invent links when labels do not match or evidence is from another photo', () => {
    const recommendation: Recommendation = {
      id: 'recommendation-2',
      title: 'Review lighting',
      description: 'Check lighting in person.',
      priority: 'Low',
      estimatedCost: 'Varies',
      difficulty: 'Easy',
      expectedImpact: 0,
      objectsInvolved: ['Lamp'],
      imageId: 'photo-a',
    };
    const linked = linkRecommendationEvidence(
      [recommendation],
      [],
      observations,
      [relation],
      provenance
    )[0];

    expect(linked.observationIds).toEqual([]);
    expect(linked.spatialFindingIds).toEqual([]);
    expect(linked.relatedHazardIds).toEqual([]);
    expect(linked.evidencePhotoIds).toEqual(['photo-a']);
  });
});
