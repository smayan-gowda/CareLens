import { analyzeSpatialRelationships } from './spatialAnalyzer';
import { evalDataset } from './evalDataset';

function relationKey(
  relation: { relationType: string; objectIds: string[]; evidenceStatus?: string }
): string {
  return `${relation.relationType}:${[...relation.objectIds].sort().join(',')}:${relation.evidenceStatus || ''}`;
}

let truePositives = 0;
let predictedCount = 0;
let expectedCount = 0;
let unsupportedConcernCount = 0;
let potentialConcernCount = 0;

for (const evaluationCase of evalDataset) {
  const predictions = analyzeSpatialRelationships(evaluationCase.detectedObjects);
  const expected = new Set(evaluationCase.expectedRelations.map(relationKey));
  const matched = new Set<string>();

  predictedCount += predictions.length;
  expectedCount += expected.size;

  for (const prediction of predictions) {
    const key = relationKey(prediction);
    if (expected.has(key) && !matched.has(key)) {
      matched.add(key);
      truePositives++;
    }
    if (prediction.evidenceStatus === 'Potential Concern') {
      potentialConcernCount++;
      if (!expected.has(key)) unsupportedConcernCount++;
    }
  }
}

const precision = predictedCount === 0 ? 1 : truePositives / predictedCount;
const recall = expectedCount === 0 ? 1 : truePositives / expectedCount;
const relationAccuracy =
  predictedCount + expectedCount === 0
    ? 1
    : (2 * truePositives) / (predictedCount + expectedCount);
const unsupportedClaimRate =
  potentialConcernCount === 0 ? 0 : unsupportedConcernCount / potentialConcernCount;

console.log(`Spatial evaluation (${evalDataset.length} cases)`);
console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
console.log(`Recall: ${(recall * 100).toFixed(1)}%`);
console.log(`Unsupported-claim rate: ${(unsupportedClaimRate * 100).toFixed(1)}%`);
console.log(`Spatial-relation accuracy (F1): ${(relationAccuracy * 100).toFixed(1)}%`);
