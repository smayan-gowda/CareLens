import { describe, expect, it } from 'vitest';
import type { DetectedObject } from '@/types/ai';
import type { SpatialEvaluationCase } from './evalDataset';
import { analyzeSpatialRelationships } from './spatialAnalyzer';
import { evaluateSpatialCases } from './spatialEvaluation';

describe('spatial evaluation metrics', () => {
  it('counts missed relations and detector misses separately', () => {
    const evaluationCase: SpatialEvaluationCase = {
      id: 'missed-obstacle',
      groundTruthObjects: [
        { id: 'gt-path', name: 'Walkway', confidence: 100, boundingBox: { x: 10, y: 55, width: 80, height: 35 } },
        { id: 'gt-cord', name: 'Cord', confidence: 100, boundingBox: { x: 35, y: 68, width: 20, height: 8 } },
      ],
      detectedObjects: [
        { id: 'det-path', name: 'Walkway', confidence: 90, boundingBox: { x: 10, y: 55, width: 80, height: 35 } },
      ],
      expectedRelations: [
        { relationType: 'walkway-overlap', objectIds: ['gt-path', 'gt-cord'], evidenceStatus: 'Potential Concern' },
      ],
    };

    const report = evaluateSpatialCases([evaluationCase], analyzeSpatialRelationships, 1);
    expect(report.missedFindings).toBe(1);
    expect(report.missedObjects).toBe(1);
    expect(report.objectTruePositives).toBe(1);
    expect(report.boxAlignmentRateAt50IoU).toBe(0.5);
  });

  it('flags ungrounded predicted statements instead of hiding them in recall', () => {
    const evaluationCase: SpatialEvaluationCase = {
      id: 'unlabeled-overclaim',
      groundTruthObjects: [
        { id: 'gt-chair', name: 'Chair', confidence: 100, boundingBox: { x: 10, y: 10, width: 20, height: 20 } },
        { id: 'gt-table', name: 'Table', confidence: 100, boundingBox: { x: 24, y: 12, width: 20, height: 20 } },
      ],
      detectedObjects: [
        { id: 'det-chair', name: 'Chair', confidence: 90, boundingBox: { x: 10, y: 10, width: 20, height: 20 } },
        { id: 'det-table', name: 'Table', confidence: 90, boundingBox: { x: 24, y: 12, width: 20, height: 20 } },
      ],
      expectedRelations: [],
    };

    const report = evaluateSpatialCases([evaluationCase], analyzeSpatialRelationships, 1);
    expect(report.falsePositives).toBeGreaterThan(0);
    expect(report.unsupportedStatementCount).toBe(report.predictedFindingCount);
  });

  it('reports no false positives as perfect precision when no findings are emitted or expected', () => {
    const noFindings: DetectedObject[] = [
      { id: 'chair', name: 'Chair', confidence: 90, boundingBox: { x: 2, y: 2, width: 10, height: 10 } },
      { id: 'cabinet', name: 'Cabinet', confidence: 90, boundingBox: { x: 80, y: 80, width: 10, height: 10 } },
    ];
    const report = evaluateSpatialCases(
      [{
        id: 'clear-room',
        detectedObjects: noFindings,
        expectedRelations: [],
      }],
      analyzeSpatialRelationships,
      1
    );
    expect(report.precision).toBeNull();
    expect(report.recall).toBeNull();
    expect(report.f1).toBeNull();
  });
});
