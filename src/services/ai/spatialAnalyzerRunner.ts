import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeSpatialRelationships } from './spatialAnalyzer';
import { evalDataset } from './evalDataset';
import { evaluateSpatialCases, type SpatialEvaluationReport } from './spatialEvaluation';
import { parseRealPhotoEvaluationManifest } from './realPhotoEval';

function percentage(value: number | null): string {
  return value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

function milliseconds(value: number | null): string {
  return value === null ? 'n/a' : `${value.toFixed(3)} ms`;
}

function printReport(title: string, report: SpatialEvaluationReport): void {
  console.log(`\n${title} (${report.caseCount} cases)`);
  console.log(`Findings: ${report.truePositives} matched / ${report.expectedFindingCount} labeled`);
  console.log(`Incorrect findings: ${report.falsePositives}`);
  console.log(`Missed findings: ${report.missedFindings}`);
  console.log(`Finding precision / recall / F1: ${percentage(report.precision)} / ${percentage(report.recall)} / ${percentage(report.f1)}`);
  console.log(`Evidence-status accuracy: ${percentage(report.statusAccuracy)}`);
  console.log(`Unsupported statements: ${report.unsupportedStatementCount} (${percentage(report.unsupportedStatementRate)} of predictions)`);
  console.log(
    `Object boxes: ${report.objectTruePositives} aligned / ${report.objectGroundTruthCount} labeled; ` +
    `${report.missedObjects} missed; ${report.extraObjects} extra; ` +
    `${report.unlocalizableGroundTruthObjects} ground-truth objects lack valid boxes; ` +
    `${report.invalidDetectionBoxes} detections lack valid boxes`
  );
  console.log(
    `Box alignment: mean IoU ${percentage(report.meanBoxIoU)}; ` +
    `IoU >= 0.50 on ${percentage(report.boxAlignmentRateAt50IoU)} of labeled boxes`
  );
  console.log(`Mean analyzer runtime: ${milliseconds(report.meanRuntimeMs)} per case`);
  console.log('By finding type:');
  if (report.byFindingType.length === 0) console.log('  No labeled finding types.');
  for (const findingType of report.byFindingType) {
    console.log(
      `  ${findingType.type}: P/R/F1 ${percentage(findingType.precision)}/${percentage(findingType.recall)}/${percentage(findingType.f1)}; ` +
      `FP ${findingType.falsePositives}; missed ${findingType.missed}; ` +
      `unsupported ${findingType.unsupportedStatements}; avg ${milliseconds(findingType.meanRuntimeMs)}`
    );
  }
  if (report.caseErrors.length > 0) {
    console.log('Cases needing review:');
    for (const issue of report.caseErrors) {
      console.log(
        `  ${issue.caseId}: false [${issue.falseFindings.join('; ') || 'none'}]; ` +
        `missed [${issue.missedFindings.join('; ') || 'none'}]; ` +
        `unsupported ${issue.unsupportedStatements}`
      );
    }
  }
}

async function loadRealPhotoCases() {
  const manifestUrl = new URL('./eval/real-photo-manifest.json', import.meta.url);
  const manifestText = await readFile(manifestUrl, 'utf8');
  const manifest = parseRealPhotoEvaluationManifest(JSON.parse(manifestText));
  const photoRoot = path.resolve(process.cwd(), 'eval-data', 'real-photos');

  for (const evaluationCase of manifest.cases) {
    const imagePath = path.resolve(process.cwd(), evaluationCase.imagePath);
    const pathFromPhotoRoot = path.relative(photoRoot, imagePath);
    if (
      pathFromPhotoRoot === '' ||
      pathFromPhotoRoot.startsWith(`..${path.sep}`) ||
      pathFromPhotoRoot === '..' ||
      path.isAbsolute(pathFromPhotoRoot)
    ) {
      throw new Error(`Real-photo case ${evaluationCase.id} must point inside eval-data/real-photos.`);
    }

    const bytes = await readFile(imagePath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (sha256.toLowerCase() !== evaluationCase.imageSha256.toLowerCase()) {
      throw new Error(`Image hash mismatch for real-photo case ${evaluationCase.id}.`);
    }
  }

  return manifest.cases;
}

async function main(): Promise<void> {
  const syntheticReport = evaluateSpatialCases(evalDataset, analyzeSpatialRelationships);
  console.log('CareLens spatial evaluation');
  console.log('Synthetic stress suite: hand-authored geometry fixtures, not real-photo evidence.');
  printReport('Synthetic results', syntheticReport);
  console.log('\nSynthetic scenario coverage:');
  for (const condition of syntheticReport.bySceneCondition) {
    console.log(`  ${condition.condition}: ${condition.cases} case(s), ${milliseconds(condition.meanRuntimeMs)} average`);
  }

  const realPhotoCases = await loadRealPhotoCases();
  if (realPhotoCases.length === 0) {
    console.log('\nReal representative photos: no reviewed cases are currently available.');
    console.log('Real-photo precision, recall, missed detections, unsupported statements, and box-alignment metrics are not measured.');
    console.log('The repository demo images are not counted as validation data without documented source rights and independent labels.');
    return;
  }

  console.log('\nReal-photo results use locally stored, rights-documented images and captured outputs from the existing vision model.');
  console.log('This replay measures the analyzer and recorded detector boxes; it does not call a model or claim results beyond this labeled set.');
  const realPhotoReport = evaluateSpatialCases(realPhotoCases, analyzeSpatialRelationships);
  printReport('Real-photo results', realPhotoReport);
}

main().catch((error: unknown) => {
  console.error('Spatial evaluation failed:', error);
  process.exitCode = 1;
});
