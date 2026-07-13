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

export interface Hazard {
  id: string;
  title: string;
  category: HazardCategory;
  severity: HazardSeverity;
  confidence: number;
  description: string;
  location: string;
  impact: string;
  objectsInvolved?: string[];
  reasoning?: string;
  boundingBox?: BoundingBox; // Normalized coordinates 0-100
  imageId?: string;
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
}

export type ScanStatus = 'Pending' | 'Analyzing' | 'Completed' | 'Failed';

export interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  boundingBox?: BoundingBox;
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
  subScores?: SubScores;
  roomType?: string;
  roomConfidence?: number;
  detectedObjects?: DetectedObject[];
  hazards: Hazard[];
  recommendations: Recommendation[];
}
