export type HazardSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type HazardCategory = 
  | 'Fall Risk' 
  | 'Trip Hazard'
  | 'Accessibility Barrier' 
  | 'Poor Lighting'
  | 'Fire Hazard'
  | 'Blocked Exit'
  | 'Unsafe Furniture'
  | 'Missing Safety Equipment'
  | 'Clutter'
  | 'Electrical Hazard'
  | 'Sharp Edge'
  | 'Water Hazard'
  | 'Structural Concern';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AssessmentTrace {
  model: string;
  rulesVersion: string;
  evaluatedAt: string;
  imageId?: string;
  engineVersion: string;
  pipeline?: ScanPipelineTrace;
}

export type PipelineOutcome = 'success' | 'retryable_failure' | 'model_failure';

export interface ModelAttemptTrace {
  model: string;
  attempt: number;
  outcome: PipelineOutcome;
  httpStatus?: number;
  errorCode?: string;
}

export interface PipelinePhotoTrace {
  imageId: string;
  role: ScanPhotoRole;
  label: string;
  mimeType: string;
  byteLength?: number;
  sha256?: string;
  modelAttempts: ModelAttemptTrace[];
  selectedModel?: string;
  reportedModelVersion?: string;
  parseStatus: 'not_started' | 'passed' | 'failed';
  validationStatus: 'not_started' | 'passed' | 'failed';
  validationIssues?: Array<{ field: string; code: string }>;
  outcome: 'completed' | 'failed';
  failureCode?: string;
}

export interface ScanPipelineTrace {
  schemaVersion: 1;
  scanId: string;
  status: 'completed' | 'failed';
  persistenceStatus: 'not_attempted' | 'saved' | 'failed';
  startedAt: string;
  completedAt: string;
  photos: PipelinePhotoTrace[];
  failureStage?: 'input_preparation' | 'model' | 'parse' | 'validation' | 'analysis' | 'storage';
  failureCode?: string;
}

export type EvidenceOrigin = 'vision-model' | 'spatial-engine' | 'user';

export interface EvidenceProvenance {
  origin: EvidenceOrigin;
  createdAt: string;
}

export type EvidenceReviewStatus = 'confirmed' | 'disputed' | 'needs_review';

export interface EvidenceReview {
  id: string;
  targetType: 'hazard' | 'spatial-finding';
  targetId: string;
  status: EvidenceReviewStatus;
  origin: 'user';
  reviewedAt: string;
  imageId?: string;
  note?: string;
}

export interface Hazard {
  id: string;
  title: string;
  category: HazardCategory;
  severity: HazardSeverity;
  confidence: number;
  description: string;
  visibleObservation?: string;
  potentialConcern?: string;
  verificationRequirement?: string;
  limitations?: string;
  suggestedNextStep?: string;
  location: string;
  impact: string;
  objectsInvolved?: string[];
  reasoning?: string;
  boundingBox?: BoundingBox; // Normalized coordinates 0-100
  imageId?: string;
  feedback?: 'helpful' | 'not_present' | 'needs_review';
  reviewStatus?: 'unresolved' | 'confirmed' | 'disputed' | 'needs_review';
  humanVerificationNote?: string;
  suggestedAction?: string;
  provenance?: EvidenceProvenance;
  observationIds?: string[];
  spatialFindingIds?: string[];
  reviewIds?: string[];
}

export type ScanPhotoRole = 'overview' | 'detail';

export interface ScanPhoto {
  id: string;
  role: ScanPhotoRole;
  label: string;
}

export type RecommendationActionStatus =
  | 'open'
  | 'accepted'
  | 'deferred'
  | 'dismissed'
  | 'follow_up_due'
  | 'verified'
  | 'reopened';

export interface RecommendationActionEvent {
  id: string;
  status: RecommendationActionStatus;
  createdAt: string;
  origin: 'user';
  note?: string;
  deferredUntil?: string;
  followUpScanId?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: HazardSeverity;
  estimatedCost: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  expectedImpact: number;
  whyDetected?: string;
  objectsInvolved?: string[];
  certainty?: number;
  falsePositivePossible?: boolean;
  imageId?: string;
  relatedHazardIds?: string[];
  observationIds?: string[];
  spatialFindingIds?: string[];
  evidencePhotoIds?: string[];
  provenance?: EvidenceProvenance;
  actionStatus?: RecommendationActionStatus;
  actionEvents?: RecommendationActionEvent[];
  deferredUntil?: string;
  completedAt?: string;
  followUpScanId?: string;
  followUpOutcome?: 'verified' | 'still_needs_work';
}

export type ScanStatus = 'Pending' | 'Analyzing' | 'Completed' | 'Failed';

export interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  boundingBox?: BoundingBox;
  imageId?: string;
  provenance?: EvidenceProvenance;
}

export type SpatialEvidenceStatus =
  | 'Observed'
  | 'Geometrically Supported'
  | 'Potential Concern'
  | 'Needs Review'
  | 'Physically Unverified';

export type SpatialRelationType =
  | 'proximity'
  | 'overlap'
  | 'duplicate-detection'
  | 'walkway-overlap'
  | 'doorway-proximity'
  | 'obstacle-destination';

export type SpatialFindingReviewStatus =
  | 'unreviewed'
  | 'confirmed'
  | 'disputed'
  | 'needs_review';

export interface SpatialFinding {
  id: string;
  relationType: SpatialRelationType;
  objectsInvolved: string[];
  objectIds: string[];
  geometricEvidence: string;
  confidence: number;
  evidenceStatus: SpatialEvidenceStatus;
  limitations: string;
  imageId?: string;
  reviewStatus?: SpatialFindingReviewStatus;
  provenance?: EvidenceProvenance;
  reviewIds?: string[];
}

export interface SubScores {
  accessibility: number;
  mobility: number;
  fireSafety: number;
  lighting: number;
  organization: number;
  fallPrevention: number;
}

export interface ScanResult {
  id: string;
  roomId: string;
  homeId: string;
  followUpFromScanId?: string;
  followUpRecommendationId?: string;
  images: string[]; // Image URLs or IDs
  photos?: ScanPhoto[]; // Aligned by index with images; each detection points to one photo ID.
  status: ScanStatus;
  createdAt: string;
  completedAt?: string;
  safetyScore: number;
  initialSafetyScore?: number;
  subScores?: SubScores;
  roomType?: string;
  roomConfidence?: number;
  detectedObjects?: DetectedObject[];
  spatialFindings?: SpatialFinding[];
  evidenceReviews?: EvidenceReview[];
  hazards: Hazard[];
  recommendations: Recommendation[];
  assessmentTrace?: AssessmentTrace;
  pipelineTrace?: ScanPipelineTrace;
}
