import { describe, expect, it } from 'vitest';
import { analyzeSpatialRelationships } from './spatialAnalyzer';
import { evalDataset } from './evalDataset';

describe('analyzeSpatialRelationships', () => {
  it('matches every labeled relation in the local evaluation dataset', () => {
    for (const evaluationCase of evalDataset) {
      const actual = analyzeSpatialRelationships(evaluationCase.detectedObjects).map((finding) => ({
        relationType: finding.relationType,
        objectIds: [...finding.objectIds].sort(),
        evidenceStatus: finding.evidenceStatus,
      }));
      const expected = evaluationCase.expectedRelations.map((relation) => ({
        relationType: relation.relationType,
        objectIds: [...relation.objectIds].sort(),
        evidenceStatus: relation.evidenceStatus,
      }));

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
});
