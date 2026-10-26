import type { DetectedObject, SpatialFinding } from '@/types/ai';
import { normalizeBoundingBox } from '@/utils/spatialGeometry';
import type { ExpectedSpatialRelation, SpatialEvaluationCase } from './evalDataset';

interface RelationMetrics {
  type: string;
  expected: number;
  predicted: number;
  truePositives: number;
  falsePositives: number;
  missed: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  statusCorrect: number;
  statusCompared: number;
  unsupportedStatements: number;
  meanRuntimeMs: number | null;
}

export interface SpatialEvaluationReport {
  caseCount: number;
  expectedFindingCount: number;
  predictedFindingCount: number;
  truePositives: number;
  falsePositives: number;
  missedFindings: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  statusAccuracy: number | null;
  unsupportedStatementCount: number;
  unsupportedStatementRate: number | null;
  objectGroundTruthCount: number;
  objectDetectionCount: number;
  objectTruePositives: number;
  unlocalizableGroundTruthObjects: number;
  invalidDetectionBoxes: number;
  missedObjects: number;
  extraObjects: number;
  meanBoxIoU: number | null;
  boxAlignmentRateAt50IoU: number | null;
  meanRuntimeMs: number | null;
  byFindingType: RelationMetrics[];
  bySceneCondition: Array<{
    condition: string;
    cases: number;
    meanRuntimeMs: number;
  }>;
  caseErrors: Array<{
    caseId: string;
    falseFindings: string[];
    missedFindings: string[];
    unsupportedStatements: number;
  }>;
}

interface CaseResult {
  evaluationCase: SpatialEvaluationCase;
  predictions: SpatialFinding[];
  runtimeMs: number;
}

function normalizedName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function relationKey(
  relation: { relationType: string; objectIds: string[] },
  objects: DetectedObject[]
): string {
  const namesById = new Map(objects.map((object) => [object.id, normalizedName(object.name)]));
  const labels = relation.objectIds.map((id) => namesById.get(id) ?? `unknown:${id}`).sort();
  return `${relation.relationType}:${labels.join('|')}`;
}

function boxIoU(first: DetectedObject, second: DetectedObject): number | null {
  const a = normalizeBoundingBox(first.boundingBox);
  const b = normalizeBoundingBox(second.boundingBox);
  if (!a || !b) return null;
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const intersection = width * height;
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function countObjectDetections(cases: SpatialEvaluationCase[]) {
  let groundTruthCount = 0;
  let detectionCount = 0;
  let truePositives = 0;
  let missedObjects = 0;
  let extraObjects = 0;
  let unlocalizableGroundTruthObjects = 0;
  let invalidDetectionBoxes = 0;
  let alignedCount = 0;
  const matchedIoUs: number[] = [];

  for (const evaluationCase of cases) {
    const groundTruth = evaluationCase.groundTruthObjects ?? evaluationCase.detectedObjects;
    const detections = [...evaluationCase.detectedObjects];
    const boxGroundTruth = groundTruth.filter((object) => normalizeBoundingBox(object.boundingBox));
    unlocalizableGroundTruthObjects += groundTruth.length - boxGroundTruth.length;
    groundTruthCount += boxGroundTruth.length;
    detectionCount += detections.length;
    invalidDetectionBoxes += detections.filter(
      (object) => !normalizeBoundingBox(object.boundingBox)
    ).length;

    for (const expected of boxGroundTruth) {
      const candidates = detections
        .map((detection, index) => ({
          detection,
          index,
          iou:
            normalizedName(expected.name) === normalizedName(detection.name)
              ? boxIoU(expected, detection)
              : null,
        }))
        .filter((candidate) => candidate.iou !== null)
        .sort((a, b) => (b.iou ?? 0) - (a.iou ?? 0));
      const best = candidates[0];
      if (!best || best.iou === null) {
        missedObjects++;
        continue;
      }
      detections.splice(best.index, 1);
      if (best.iou >= 0.5) {
        truePositives++;
        alignedCount++;
        matchedIoUs.push(best.iou);
      } else {
        missedObjects++;
        extraObjects++;
      }
    }
    extraObjects += detections.length;
  }

  return {
    groundTruthCount,
    detectionCount,
    truePositives,
    missedObjects,
    extraObjects,
    unlocalizableGroundTruthObjects,
    invalidDetectionBoxes,
    meanBoxIoU:
      matchedIoUs.length > 0
        ? matchedIoUs.reduce((sum, iou) => sum + iou, 0) / matchedIoUs.length
        : null,
    boxAlignmentRateAt50IoU:
      groundTruthCount > 0 ? alignedCount / groundTruthCount : null,
  };
}

function evidenceIsGrounded(
  prediction: SpatialFinding,
  detectedObjects: DetectedObject[]
): boolean {
  if (prediction.objectIds.length !== 2 || prediction.objectsInvolved.length !== 2) return false;
  const objectsById = new Map(detectedObjects.map((object) => [object.id, object]));
  const evidence = prediction.geometricEvidence.toLowerCase();
  const hasBoxEvidence = prediction.objectIds.every((id) => {
    const object = objectsById.get(id);
    const box = normalizeBoundingBox(object?.boundingBox);
    if (!object || !box) return false;
    const coordinates = `${object.name} [${box.x}, ${box.y}, ${box.width}, ${box.height}]`.toLowerCase();
    return evidence.includes(coordinates);
  });
  return hasBoxEvidence && prediction.limitations.length > 0;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function f1(precision: number | null, recall: number | null): number | null {
  if (precision === null || recall === null || precision + recall === 0) return null;
  return (2 * precision * recall) / (precision + recall);
}

function createTypeMetrics(
  type: string,
  expected: number,
  predicted: number,
  truePositives: number,
  statusCorrect: number,
  statusCompared: number,
  unsupportedStatements: number,
  runtimeValues: number[]
): RelationMetrics {
  const precision = ratio(truePositives, predicted);
  const recall = ratio(truePositives, expected);
  return {
    type,
    expected,
    predicted,
    truePositives,
    falsePositives: predicted - truePositives,
    missed: expected - truePositives,
    precision,
    recall,
    f1: f1(precision, recall),
    statusCorrect,
    statusCompared,
    unsupportedStatements,
    meanRuntimeMs:
      runtimeValues.length > 0
        ? runtimeValues.reduce((sum, value) => sum + value, 0) / runtimeValues.length
        : null,
  };
}

export function evaluateSpatialCases(
  cases: SpatialEvaluationCase[],
  analyze: (objects: DetectedObject[]) => SpatialFinding[],
  timingRuns = 10
): SpatialEvaluationReport {
  const caseResults: CaseResult[] = cases.map((evaluationCase) => {
    for (let i = 0; i < 3; i++) analyze(evaluationCase.detectedObjects);
    const start = performance.now();
    let predictions: SpatialFinding[] = [];
    const iterations = Math.max(1, timingRuns);
    for (let i = 0; i < iterations; i++) {
      predictions = analyze(evaluationCase.detectedObjects);
    }
    return {
      evaluationCase,
      predictions,
      runtimeMs: (performance.now() - start) / iterations,
    };
  });

  const typeNames = new Set<string>();
  const typeCounts = new Map<
    string,
    {
      expected: number;
      predicted: number;
      truePositives: number;
      statusCorrect: number;
      statusCompared: number;
      unsupportedStatements: number;
      runtimeValues: number[];
    }
  >();
  let expectedFindingCount = 0;
  let predictedFindingCount = 0;
  let truePositives = 0;
  let statusCorrect = 0;
  let statusCompared = 0;
  let unsupportedStatementCount = 0;
  const caseErrors: SpatialEvaluationReport['caseErrors'] = [];

  for (const { evaluationCase, predictions, runtimeMs } of caseResults) {
    const groundTruthObjects = evaluationCase.groundTruthObjects ?? evaluationCase.detectedObjects;
    const detectionRelations = new Map<string, ExpectedSpatialRelation>();
    evaluationCase.expectedRelations.forEach((relation) => {
      detectionRelations.set(relationKey(relation, groundTruthObjects), relation);
      typeNames.add(relation.relationType);
    });
    const predictedRelations = new Set<string>();
    const predictedKeys = new Map<string, number>();
    predictions.forEach((prediction) => typeNames.add(prediction.relationType));
    expectedFindingCount += evaluationCase.expectedRelations.length;
    predictedFindingCount += predictions.length;

    for (const prediction of predictions) {
      const key = relationKey(prediction, evaluationCase.detectedObjects);
      const expected = detectionRelations.get(key);
      const isMatch = Boolean(expected && !predictedRelations.has(key));
      predictedKeys.set(key, (predictedKeys.get(key) ?? 0) + 1);
      if (isMatch && expected) {
        truePositives++;
        statusCompared++;
        if (prediction.evidenceStatus === expected.evidenceStatus) statusCorrect++;
        predictedRelations.add(key);
      }

      const statementUnsupported =
        !isMatch ||
        !evidenceIsGrounded(prediction, evaluationCase.detectedObjects) ||
        (prediction.evidenceStatus === 'Potential Concern' &&
          expected?.evidenceStatus !== 'Potential Concern');
      if (statementUnsupported) unsupportedStatementCount++;

      const typeCount = typeCounts.get(prediction.relationType) ?? {
        expected: 0,
        predicted: 0,
        truePositives: 0,
        statusCorrect: 0,
        statusCompared: 0,
        unsupportedStatements: 0,
        runtimeValues: [],
      };
      typeCount.predicted++;
      typeCount.runtimeValues.push(runtimeMs);
      if (isMatch) {
        typeCount.truePositives++;
        typeCount.statusCompared++;
        if (expected?.evidenceStatus === prediction.evidenceStatus) typeCount.statusCorrect++;
      }
      if (statementUnsupported) typeCount.unsupportedStatements++;
      typeCounts.set(prediction.relationType, typeCount);
    }

    for (const relation of evaluationCase.expectedRelations) {
      const typeCount = typeCounts.get(relation.relationType) ?? {
        expected: 0,
        predicted: 0,
        truePositives: 0,
        statusCorrect: 0,
        statusCompared: 0,
        unsupportedStatements: 0,
        runtimeValues: [],
      };
      typeCount.expected++;
      typeCounts.set(relation.relationType, typeCount);
    }

    const falseFindings: string[] = [];
    for (const [key, count] of predictedKeys) {
      if (!detectionRelations.has(key)) {
        falseFindings.push(key);
      } else if (count > 1) {
        falseFindings.push(`${key} (duplicate prediction)`);
      }
    }
    const missedFindings = [...detectionRelations.keys()].filter(
      (key) => !predictedRelations.has(key)
    );
    const unsupportedCount = predictions.filter((prediction) => {
      const key = relationKey(prediction, evaluationCase.detectedObjects);
      const expected = detectionRelations.get(key);
      return (
        !expected ||
        !evidenceIsGrounded(prediction, evaluationCase.detectedObjects) ||
        (prediction.evidenceStatus === 'Potential Concern' &&
          expected.evidenceStatus !== 'Potential Concern')
      );
    }).length;
    if (falseFindings.length > 0 || missedFindings.length > 0 || unsupportedCount > 0) {
      caseErrors.push({
        caseId: evaluationCase.id,
        falseFindings,
        missedFindings,
        unsupportedStatements: unsupportedCount,
      });
    }
  }

  const objectMetrics = countObjectDetections(cases);
  const precision = ratio(truePositives, predictedFindingCount);
  const recall = ratio(truePositives, expectedFindingCount);
  const runtimes = caseResults.map((result) => result.runtimeMs);
  const conditions = new Map<string, number[]>();
  for (const result of caseResults) {
    const condition = [
      result.evaluationCase.roomType ?? 'unspecified room',
      result.evaluationCase.cameraAngle ?? 'unspecified angle',
      result.evaluationCase.lighting ?? 'unspecified lighting',
    ].join(' · ');
    conditions.set(condition, [...(conditions.get(condition) ?? []), result.runtimeMs]);
  }

  return {
    caseCount: cases.length,
    expectedFindingCount,
    predictedFindingCount,
    truePositives,
    falsePositives: predictedFindingCount - truePositives,
    missedFindings: expectedFindingCount - truePositives,
    precision,
    recall,
    f1: f1(precision, recall),
    statusAccuracy: ratio(statusCorrect, statusCompared),
    unsupportedStatementCount,
    unsupportedStatementRate: ratio(unsupportedStatementCount, predictedFindingCount),
    objectGroundTruthCount: objectMetrics.groundTruthCount,
    objectDetectionCount: objectMetrics.detectionCount,
    objectTruePositives: objectMetrics.truePositives,
    unlocalizableGroundTruthObjects: objectMetrics.unlocalizableGroundTruthObjects,
    invalidDetectionBoxes: objectMetrics.invalidDetectionBoxes,
    missedObjects: objectMetrics.missedObjects,
    extraObjects: objectMetrics.extraObjects,
    meanBoxIoU: objectMetrics.meanBoxIoU,
    boxAlignmentRateAt50IoU: objectMetrics.boxAlignmentRateAt50IoU,
    meanRuntimeMs:
      runtimes.length > 0
        ? runtimes.reduce((sum, value) => sum + value, 0) / runtimes.length
        : null,
    byFindingType: [...typeNames]
      .sort()
      .map((type) => {
        const counts = typeCounts.get(type) ?? {
          expected: 0,
          predicted: 0,
          truePositives: 0,
          statusCorrect: 0,
          statusCompared: 0,
          unsupportedStatements: 0,
          runtimeValues: [],
        };
        return createTypeMetrics(
          type,
          counts.expected,
          counts.predicted,
          counts.truePositives,
          counts.statusCorrect,
          counts.statusCompared,
          counts.unsupportedStatements,
          counts.runtimeValues
        );
      }),
    bySceneCondition: [...conditions.entries()].map(([condition, times]) => ({
      condition,
      cases: times.length,
      meanRuntimeMs: times.reduce((sum, value) => sum + value, 0) / times.length,
    })),
    caseErrors,
  };
}
