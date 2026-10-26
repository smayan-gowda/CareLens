import type {
  PipelinePhotoTrace,
  ScanPhotoRole,
} from '@/types/ai';
import type { SafetyAnalysis } from './schemas';
import { validateSafetyAnalysis } from './analysisValidation';

export interface RoomPhotoAnalysis {
  analysis: SafetyAnalysis;
  photoTrace?: PipelinePhotoTrace;
}

export class AnalysisPipelineError extends Error {
  constructor(
    message: string,
    readonly failureStage: 'model' | 'parse' | 'validation',
    readonly failureCode: string,
    readonly photoTrace?: PipelinePhotoTrace
  ) {
    super(message);
    this.name = 'AnalysisPipelineError';
  }
}

interface RoomPhotoContext {
  scanId: string;
  imageId: string;
  role: ScanPhotoRole;
  label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function analyzeRoomImage(
  imageBase64: string | string[],
  roomType: string | undefined,
  photo: RoomPhotoContext
): Promise<RoomPhotoAnalysis> {
  let response: Response;
  try {
    response = await fetch('/api/analyze-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: Array.isArray(imageBase64) ? imageBase64[0] : imageBase64,
        imagesBase64: Array.isArray(imageBase64) ? imageBase64 : [imageBase64],
        roomType,
        scanId: photo.scanId,
        imageId: photo.imageId,
        photoRole: photo.role,
        photoLabel: photo.label,
      }),
    });
  } catch {
    throw new AnalysisPipelineError(
      'Could not connect to the room analysis service. Check your connection and retry.',
      'model',
      'api_unreachable'
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    const body: unknown = await response.json();
    if (isRecord(body)) payload = body;
  } catch {
    payload = {};
  }

  const photoTrace = isRecord(payload.photoTrace)
    ? payload.photoTrace as unknown as PipelinePhotoTrace
    : undefined;

  if (!response.ok) {
    const errorMessage = typeof payload.error === 'string'
      ? payload.error
      : 'Failed to analyze room image. Please try again or select another angle.';
    const failureStage = payload.failureStage === 'parse' || payload.failureStage === 'validation'
      ? payload.failureStage
      : 'model';
    const failureCode = typeof payload.failureCode === 'string'
      ? payload.failureCode
      : `http_${response.status}`;
    throw new AnalysisPipelineError(errorMessage, failureStage, failureCode, photoTrace);
  }

  const candidate = 'analysis' in payload ? payload.analysis : payload;
  const validation = validateSafetyAnalysis(candidate);
  if (!validation.success) {
    throw new AnalysisPipelineError(
      'The analysis service returned an invalid result.',
      'validation',
      'client_schema_validation_failed',
      photoTrace
        ? { ...photoTrace, validationStatus: 'failed', outcome: 'failed', failureCode: 'client_schema_validation_failed' }
        : undefined
    );
  }

  return { analysis: validation.data, photoTrace };
}
