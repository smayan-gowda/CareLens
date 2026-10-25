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
  reviewStatus?: 'unresolved' | 'confirmed' | 'disputed';
  humanVerificationNote?: string;
  suggestedAction?: string;
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
  relatedHazardIds?: string[];
  completedAt?: string;
}

export type ScanStatus = 'Pending' | 'Analyzing' | 'Completed' | 'Failed';

export interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  boundingBox?: BoundingBox;
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

export interface SpatialFinding {
  id: string;
  relationType: SpatialRelationType;
  objectsInvolved: string[];
  objectIds: string[];
  geometricEvidence: string;
  confidence: number;
  evidenceStatus: SpatialEvidenceStatus;
  limitations: string;
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
  images: string[]; // Image URLs or IDs
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
  hazards: Hazard[];
  recommendations: Recommendation[];
  assessmentTrace?: AssessmentTrace;
}
