import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analysisService, ScanPipelineError } from './analysisService';
import { compareAssessments } from '@/utils/assessmentComparison';
import { useScanStore } from '@/stores/scanStore';
import type { PipelinePhotoTrace } from '@/types/ai';
import type { SafetyAnalysis } from './schemas';

const firestoreMocks = vi.hoisted(() => ({
  setDoc: vi.fn(async (_reference: unknown, _data: unknown) => undefined),
  updateDoc: vi.fn(async (_reference: unknown, _data: unknown) => undefined),
  deleteDoc: vi.fn(async () => undefined),
  getDocs: vi.fn(async () => ({ docs: [] })),
  addDoc: vi.fn(async () => undefined),
  onSnapshot: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  cleanUndefined: (value: unknown) => value,
  handleFirestoreError: (error: unknown) => { throw error; },
  OperationType: { CREATE: 'create', UPDATE: 'update', DELETE: 'delete' },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args: unknown[]) => args),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn((...args: unknown[]) => args),
  onSnapshot: firestoreMocks.onSnapshot,
  addDoc: firestoreMocks.addDoc,
  updateDoc: firestoreMocks.updateDoc,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: vi.fn((...args: unknown[]) => args),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: firestoreMocks.setDoc,
  getDocs: firestoreMocks.getDocs,
}));

vi.mock('@/utils/imageCompression', () => ({
  compressImageDataUrl: vi.fn(async (image: string) => image),
}));

vi.mock('@/services/storageService', () => ({
  processImageForStorage: vi.fn(async (image: string) => image),
}));

const analysis: SafetyAnalysis = {
  roomType: 'Living room',
  confidence: 86,
  overallSafetyScore: 74,
  subScores: {
    accessibility: 72,
    mobility: 70,
    fireSafety: 82,
    lighting: 76,
    organization: 68,
    fallPrevention: 75,
  },
  detectedObjects: [],
  hazards: [{
    title: 'Cord visible on the floor',
    category: 'Trip Hazard',
    severity: 'Medium',
    description: 'A cable is visible on the floor.',
    visibleObservation: 'A cable crosses part of the visible floor.',
    potentialConcern: 'The cable may be a trip concern.',
    verificationRequirement: 'Check the walking route in person.',
    limitations: 'A single image does not establish floor clearance.',
    suggestedNextStep: 'Review the area and secure the cable if needed.',
    location: 'Floor',
    confidence: 81,
    objectsInvolved: ['cord'],
    reasoning: 'A cable is visible on the floor.',
    boundingBox: { x: 20, y: 40, width: 15, height: 8 },
  }],
  recommendations: [{
    title: 'Review the visible cable',
    description: 'Consider routing it outside the walking area.',
    priority: 'soon',
    estimatedCost: { min: 0, max: 20 },
    expectedImpact: 40,
    whyDetected: 'A cable is visible on the floor.',
    objectsInvolved: ['cord'],
    certainty: 72,
    falsePositivePossible: true,
  }],
};

function makePhotoTrace(body: Record<string, unknown>): PipelinePhotoTrace {
  return {
    imageId: String(body.imageId),
    role: body.photoRole === 'detail' ? 'detail' : 'overview',
    label: String(body.photoLabel),
    mimeType: 'image/jpeg',
    byteLength: 5,
    sha256: 'a'.repeat(64),
    modelAttempts: [{ model: 'gemma-4-26b-a4b-it', attempt: 1, outcome: 'success' }],
    selectedModel: 'gemma-4-26b-a4b-it',
    reportedModelVersion: 'test-model-version',
    parseStatus: 'passed',
    validationStatus: 'passed',
    outcome: 'completed',
  };
}

function installSuccessfulAnalysisApi() {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({
      analysis,
      photoTrace: makePhotoTrace(body),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('scan lifecycle with pipeline trace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    useScanStore.setState({ scans: {} });
  });

  it('traces uploaded photo through saved report, user review, and follow-up comparison', async () => {
    const fetchMock = installSuccessfulAnalysisApi();
    const sourcePhoto = 'data:image/jpeg;base64,aGVsbG8=';
    const firstScan = await analysisService.analyzeRoom('home-1', 'room-1', [{
      id: 'photo-before',
      role: 'overview',
      label: 'Room overview',
      image: sourcePhoto,
    }]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstScan.pipelineTrace?.photos[0]).toMatchObject({
      imageId: 'photo-before',
      byteLength: 5,
      sha256: 'a'.repeat(64),
      selectedModel: 'gemma-4-26b-a4b-it',
      parseStatus: 'passed',
      validationStatus: 'passed',
    });
    expect(firstScan.pipelineTrace).not.toHaveProperty('image');
    expect(JSON.stringify(firstScan.pipelineTrace)).not.toContain(sourcePhoto);

    const firstScanId = firstScan.id;
    await useScanStore.getState().addScan('user-1', 'room-1', firstScan);
    const persistedFirstScan = JSON.parse(JSON.stringify(firestoreMocks.setDoc.mock.calls[0][1])) as typeof firstScan;
    expect(persistedFirstScan.id).toBe(firstScanId);
    expect(persistedFirstScan.pipelineTrace?.persistenceStatus).toBe('saved');

    useScanStore.setState({ scans: { 'room-1': [persistedFirstScan] } });
    const hazardId = persistedFirstScan.hazards[0].id;
    const review = await useScanStore.getState().updateHazardFeedback(firstScanId, hazardId, 'helpful');
    expect(review).toMatchObject({
      targetType: 'hazard',
      targetId: hazardId,
      status: 'confirmed',
      origin: 'user',
      imageId: 'photo-before',
    });
    expect(useScanStore.getState().getScanById(firstScanId)?.evidenceReviews).toContainEqual(review);
    expect(firestoreMocks.updateDoc).toHaveBeenCalled();

    const recommendationId = persistedFirstScan.recommendations[0].id;
    const scoreBeforeAction = useScanStore.getState().getScanById(firstScanId)?.safetyScore;
    await useScanStore.getState().updateRecommendationAction(
      firstScanId,
      recommendationId,
      'accepted',
      { note: 'We will reroute the cable.' }
    );
    expect(useScanStore.getState().getScanById(firstScanId)?.safetyScore).toBe(scoreBeforeAction);

    const followUp = await analysisService.analyzeRoom('home-1', 'room-1', [{
      id: 'photo-after',
      role: 'overview',
      label: 'Room overview',
      image: sourcePhoto,
    }]);
    const followUpId = followUp.id;
    await useScanStore.getState().addScan('user-1', 'room-1', followUp);
    const persistedFollowUp = {
      ...(JSON.parse(JSON.stringify(firestoreMocks.setDoc.mock.calls[1][1])) as typeof followUp),
      followUpFromScanId: firstScanId,
      followUpRecommendationId: recommendationId,
    };
    await useScanStore.getState().updateRecommendationAction(
      firstScanId,
      recommendationId,
      'follow_up_due',
      { followUpScanId: followUpId, note: 'Compare after the change.' }
    );

    const reviewedBefore = useScanStore.getState().getScanById(firstScanId)!;
    const comparison = compareAssessments(reviewedBefore, persistedFollowUp);
    expect(persistedFollowUp.id).toBe(followUpId);
    expect(comparison.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        status: 'still_reported',
        beforeImageId: 'photo-before',
        afterImageId: 'photo-after',
      }),
    ]));

    await useScanStore.getState().updateRecommendationAction(
      firstScanId,
      recommendationId,
      'verified',
      { followUpOutcome: 'verified', note: 'Reviewed both room photos.' }
    );
    expect(useScanStore.getState().getScanById(firstScanId)?.recommendations[0]).toMatchObject({
      actionStatus: 'verified',
      followUpOutcome: 'verified',
      followUpScanId: followUpId,
    });
    expect(useScanStore.getState().getScanById(firstScanId)?.safetyScore).toBe(scoreBeforeAction);
  });

  it('retains a failed run trace without storing the image or provider error text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: 'Failed to analyze room image. Please try again or select another angle.',
      failureStage: 'model',
      failureCode: 'http_503',
      photoTrace: {
        ...makePhotoTrace({ imageId: 'photo-failed', photoRole: 'overview', photoLabel: 'Room overview' }),
        outcome: 'failed',
        failureCode: 'http_503',
        modelAttempts: [{
          model: 'gemma-4-26b-a4b-it',
          attempt: 3,
          outcome: 'model_failure',
          httpStatus: 503,
          errorCode: 'http_503',
        }],
      },
    }), { status: 502, headers: { 'Content-Type': 'application/json' } })));

    let trace: ScanPipelineError['trace'] | undefined;
    try {
      await analysisService.analyzeRoom('home-1', 'room-1', [{
        id: 'photo-failed',
        role: 'overview',
        label: 'Room overview',
        image: 'data:image/jpeg;base64,aGVsbG8=',
      }]);
    } catch (error) {
      expect(error).toBeInstanceOf(ScanPipelineError);
      trace = (error as ScanPipelineError).trace;
    }

    expect(trace).toMatchObject({
      status: 'failed',
      failureStage: 'model',
      failureCode: 'http_503',
      photos: [{ imageId: 'photo-failed', outcome: 'failed' }],
    });
    expect(JSON.stringify(trace)).not.toContain('aGVsbG8=');
    expect(JSON.stringify(trace)).not.toContain('provider error');

    await useScanStore.getState().recordPipelineTrace('user-1', trace!);
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-1',
        scanId: trace?.scanId,
        status: 'failed',
      })
    );
  });
});
