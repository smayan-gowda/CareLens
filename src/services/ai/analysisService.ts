import type {
  DetectedObject,
  Hazard,
  PipelinePhotoTrace,
  Recommendation,
  ScanPhoto,
  ScanPipelineTrace,
  ScanResult,
  SpatialFinding,
} from '@/types/ai';
import { analyzeRoomImage, AnalysisPipelineError } from './visionAnalyzer';
import { extractHazards } from './safetyAnalyzer';
import { generateRecommendations } from './recommendationGenerator';
import { compressImageDataUrl } from '@/utils/imageCompression';
import { getScoreFormulaBreakdown } from '@/components/reports/reportMath';
import { analyzePhotoRelationships, assignDetectionsToPhoto } from './photoEvidence';
import { linkHazardEvidence, linkRecommendationEvidence } from './evidenceLinks';

export interface ScanPhotoInput extends ScanPhoto {
  image: string;
}

export class ScanPipelineError extends Error {
  constructor(message: string, readonly trace: ScanPipelineTrace) {
    super(message);
    this.name = 'ScanPipelineError';
  }
}

const MAX_SCAN_PHOTOS = 4;

async function getImageForAnalysis(url: string): Promise<string> {
  if (!url.startsWith('blob:')) return url;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not prepare the selected photo for analysis.'));
        return;
      }
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read one of the selected room photos.'));
    img.src = url;
  });
}

function createInputTrace(photo: ScanPhotoInput): PipelinePhotoTrace {
  const match = photo.image.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  const encodedData = match?.[2];
  const padding = encodedData?.endsWith('==') ? 2 : encodedData?.endsWith('=') ? 1 : 0;
  const byteLength = encodedData
    ? Math.max(0, Math.floor(encodedData.length * 3 / 4) - padding)
    : undefined;

  return {
    imageId: photo.id,
    role: photo.role,
    label: typeof photo.label === 'string' ? photo.label.slice(0, 200) : 'Room photo',
    mimeType: match?.[1] || 'unknown',
    byteLength,
    modelAttempts: [],
    parseStatus: 'not_started',
    validationStatus: 'not_started',
    outcome: 'failed',
  };
}

function getFailureDetails(error: unknown): {
  message: string;
  stage: ScanPipelineTrace['failureStage'];
  code: string;
} {
  if (error instanceof AnalysisPipelineError) {
    return {
      message: error.message,
      stage: error.failureStage,
      code: error.failureCode,
    };
  }
  return {
    message: error instanceof Error
      ? error.message
      : 'The room analysis could not be completed. Please retry.',
    stage: 'analysis',
    code: 'analysis_processing_failed',
  };
}

export const analysisService = {
  analyzeRoom: async (
    homeId: string,
    roomId: string,
    photos: ScanPhotoInput[],
    onProgress?: (stage: number, progress: number) => void
  ): Promise<ScanResult> => {
    const scanId = `scan-${Date.now()}-${crypto.randomUUID()}`;
    const startedAt = new Date().toISOString();
    const trace: ScanPipelineTrace = {
      schemaVersion: 1,
      scanId,
      status: 'failed',
      persistenceStatus: 'not_attempted',
      startedAt,
      completedAt: startedAt,
      photos: photos.map(createInputTrace),
    };
    let failureStage: ScanPipelineTrace['failureStage'] = 'input_preparation';

    try {
      if (photos.length === 0 || photos[0].role !== 'overview') {
        throw new Error('A room overview photo is required before analysis.');
      }
      if (photos.length > MAX_SCAN_PHOTOS) {
        throw new Error(`A room scan can include one overview and up to ${MAX_SCAN_PHOTOS - 1} detail photos.`);
      }

      onProgress?.(1, 15);
      const preparedPhotos = await Promise.all(
        photos.map(async (photo) => ({
          ...photo,
          image: await getImageForAnalysis(photo.image),
        }))
      );

      onProgress?.(2, 35);
      const evaluatedAt = new Date().toISOString();
      const modelProvenance = { origin: 'vision-model' as const, createdAt: evaluatedAt };
      const spatialProvenance = { origin: 'spatial-engine' as const, createdAt: evaluatedAt };
      const detectionsByPhoto: DetectedObject[][] = [];
      const hazards: Hazard[] = [];
      const recommendations: Recommendation[] = [];
      const spatialFindings: SpatialFinding[] = [];
      let overviewAnalysis: Awaited<ReturnType<typeof analyzeRoomImage>>['analysis'] | undefined;

      for (const [index, photo] of preparedPhotos.entries()) {
        failureStage = 'model';
        let photoResult: Awaited<ReturnType<typeof analyzeRoomImage>>;
        try {
          photoResult = await analyzeRoomImage(photo.image, 'room', {
            scanId,
            imageId: photo.id,
            role: photo.role,
            label: photo.label,
          });
        } catch (error) {
          if (error instanceof AnalysisPipelineError && error.photoTrace) {
            trace.photos[index] = error.photoTrace;
          } else if (error instanceof AnalysisPipelineError) {
            trace.photos[index] = {
              ...trace.photos[index],
              outcome: 'failed',
              failureCode: error.failureCode,
            };
          }
          throw error;
        }
        trace.photos[index] = photoResult.photoTrace ?? {
          ...trace.photos[index],
          outcome: 'completed',
          parseStatus: 'passed',
          validationStatus: 'passed',
          failureCode: undefined,
        };
        const analysis = photoResult.analysis;
        if (index === 0) overviewAnalysis = analysis;

        failureStage = 'analysis';
        const detections = assignDetectionsToPhoto(
          analysis.detectedObjects,
          photo.id,
          scanId,
          modelProvenance
        );
        const photoFindings = analyzePhotoRelationships(
          detections,
          photo.id,
          scanId,
          spatialProvenance
        );
        const photoHazards = linkHazardEvidence(
          extractHazards(analysis, scanId, photo.id),
          detections,
          photoFindings,
          modelProvenance
        );
        const photoRecommendations = linkRecommendationEvidence(
          generateRecommendations(analysis, photoHazards).map(
            (recommendation, recommendationIndex) => ({
              ...recommendation,
              id: `recommendation-${scanId}-${photo.id}-${recommendationIndex}`,
              imageId: photo.id,
            })
          ),
          photoHazards,
          detections,
          photoFindings,
          modelProvenance
        );

        detectionsByPhoto.push(detections);
        hazards.push(...photoHazards);
        recommendations.push(...photoRecommendations);
        spatialFindings.push(...photoFindings);
        onProgress?.(3, 40 + Math.round(((index + 1) / preparedPhotos.length) * 35));
      }

      if (!overviewAnalysis) {
        throw new Error('The room overview photo could not be analyzed.');
      }

      failureStage = 'analysis';
      onProgress?.(4, 80);
      const storedImages = await Promise.all(
        preparedPhotos.map((photo) =>
          compressImageDataUrl(photo.image, 1280, 1280, 0.75, 250)
        )
      );
      const scoreBreakdown = getScoreFormulaBreakdown(hazards);
      trace.status = 'completed';
      trace.completedAt = new Date().toISOString();

      onProgress?.(6, 100);

      return {
        id: scanId,
        roomId,
        homeId,
        createdAt: evaluatedAt,
        images: storedImages,
        photos: preparedPhotos.map(({ id, role, label }) => ({ id, role, label })),
        status: 'Completed',
        safetyScore: scoreBreakdown.calculatedScore,
        initialSafetyScore: scoreBreakdown.calculatedScore,
        subScores: overviewAnalysis.subScores,
        roomType: overviewAnalysis.roomType,
        roomConfidence: overviewAnalysis.confidence,
        detectedObjects: detectionsByPhoto.flat(),
        spatialFindings,
        hazards,
        recommendations,
        pipelineTrace: trace,
        assessmentTrace: {
          model: trace.photos[0]?.selectedModel || 'unknown',
          rulesVersion: '2.4.0',
          evaluatedAt,
          imageId: preparedPhotos[0].id,
          engineVersion: 'carelens-vision-v2',
          pipeline: trace,
        },
      };
    } catch (error) {
      const failure = getFailureDetails(error);
      trace.status = 'failed';
      trace.completedAt = new Date().toISOString();
      trace.failureStage = failure.stage || failureStage;
      trace.failureCode = failure.code;
      throw new ScanPipelineError(failure.message, trace);
    }
  },
};
