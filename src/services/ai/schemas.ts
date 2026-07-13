export interface SafetyAnalysis {
  roomType: string;
  confidence: number;
  overallSafetyScore: number;
  subScores: {
    accessibility: number;
    mobility: number;
    fireSafety: number;
    lighting: number;
    organization: number;
    fallPrevention: number;
  };
  detectedObjects: {
    name: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  hazards: {
    title: string;
    category: string;
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    location: string;
    confidence: number;
    objectsInvolved: string[];
    reasoning: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  recommendations: {
    title: string;
    description: string;
    priority: "immediate" | "soon" | "future";
    estimatedCost: {
      min: number;
      max: number;
    };
    expectedImpact: number;
    whyDetected: string;
    objectsInvolved: string[];
    certainty: number;
    falsePositivePossible: boolean;
  }[];
}
