import { z } from 'zod';
import type { SafetyAnalysis } from './schemas';

const score = z.number().finite().min(0).max(100);
const boundingBox = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

const analysisSchema = z.object({
  roomType: z.string(),
  confidence: score,
  overallSafetyScore: score,
  subScores: z.object({
    accessibility: score,
    mobility: score,
    fireSafety: score,
    lighting: score,
    organization: score,
    fallPrevention: score,
  }),
  detectedObjects: z.array(z.object({
    name: z.string(),
    confidence: score,
    boundingBox,
  })),
  hazards: z.array(z.object({
    title: z.string(),
    category: z.string(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    description: z.string(),
    visibleObservation: z.string().optional(),
    potentialConcern: z.string().optional(),
    verificationRequirement: z.string().optional(),
    limitations: z.string().optional(),
    suggestedNextStep: z.string().optional(),
    location: z.string(),
    confidence: score,
    objectsInvolved: z.array(z.string()),
    reasoning: z.string(),
    boundingBox,
  })),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['immediate', 'soon', 'future']),
    estimatedCost: z.object({
      min: z.number().finite().nonnegative(),
      max: z.number().finite().nonnegative(),
    }),
    expectedImpact: score,
    whyDetected: z.string(),
    objectsInvolved: z.array(z.string()),
    certainty: score,
    falsePositivePossible: z.boolean(),
  })),
});

export function validateSafetyAnalysis(value: unknown):
  | { success: true; data: SafetyAnalysis }
  | { success: false; issues: Array<{ field: string; code: string }> } {
  const result = analysisSchema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    issues: result.error.issues.slice(0, 20).map((issue) => ({
      field: issue.path.map(String).join('.'),
      code: issue.code,
    })),
  };
}
