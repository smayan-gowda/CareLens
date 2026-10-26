import { describe, expect, it } from 'vitest';
import { analyzeSpatialRelationships } from './spatialAnalyzer';
import { evalDataset } from './evalDataset';

describe('analyzeSpatialRelationships', () => {
  it('matches labeled relations for synthetic cases without intentional detector failures', () => {
    for (const evaluationCase of evalDataset.filter(
      (item) =>
        !item.difficulty?.includes('missed by the detector') &&
        !item.difficulty?.includes('false object detection')
    )) {
      const groundTruthObjects =
        evaluationCase.groundTruthObjects ?? evaluationCase.detectedObjects;
      const actual = analyzeSpatialRelationships(evaluationCase.detectedObjects).map((finding) => ({
        relationType: finding.relationType,
        objectNames: finding.objectIds
          .map((id) => evaluationCase.detectedObjects.find((object) => object.id === id)?.name ?? id)
          .sort(),
        evidenceStatus: finding.evidenceStatus,
      }));
      const expected = evaluationCase.expectedRelations
        .map((relation) => ({
          relationType: relation.relationType,
          objectNames: relation.objectIds
            .map((id) => groundTruthObjects.find((object) => object.id === id)?.name ?? id)
            .sort(),
          evidenceStatus: relation.evidenceStatus,
        }))
        .filter((relation) =>
          relation.objectNames.every((name) =>
            evaluationCase.detectedObjects.some((object) => object.name === name)
          )
        );

      expect(actual, evaluationCase.id).toEqual(expected);
    }
  });

  it('does not derive findings from missing or invalid geometry', () => {
    const findings = analyzeSpatialRelationships([
      { id: 'missing', name: 'Cord', confidence: 90 },
      { id: 'invalid', name: 'Chair', confidence: 90, boundingBox: { x: -1, y: 0, width: 20, height: 20 } },
    ]);

    expect(findings).toEqual([]);
  });

  it('includes coordinate evidence and explicit limitations for each finding', () => {
    const findings = analyzeSpatialRelationships([
      { id: 'chair', name: 'Chair', confidence: 90, boundingBox: { x: 10, y: 10, width: 15, height: 15 } },
      { id: 'table', name: 'Table', confidence: 90, boundingBox: { x: 30, y: 10, width: 15, height: 15 } },
    ]);

    expect(findings[0]).toMatchObject({
      evidenceStatus: 'Geometrically Supported',
      objectsInvolved: ['Chair', 'Table'],
    });
    expect(findings[0].geometricEvidence).toContain('image-coordinate');
    expect(findings[0].limitations).toContain('real-world distance');
  });

  it('uses the same normalized geometry for fractional-coordinate detections', () => {
    const findings = analyzeSpatialRelationships([
      { id: 'chair', name: 'Chair', confidence: 90, boundingBox: { x: 0.1, y: 0.1, width: 0.15, height: 0.15 } },
      { id: 'table', name: 'Table', confidence: 90, boundingBox: { x: 0.3, y: 0.1, width: 0.15, height: 0.15 } },
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].geometricEvidence).toContain('Chair [10, 10, 15, 15]');
  });
});
