import { Recommendation, Hazard } from "@/types/ai";
import { SafetyAnalysis } from "./schemas";

export function generateRecommendations(analysis: SafetyAnalysis, hazards: Hazard[]): Recommendation[] {
  return analysis.recommendations.map((r, i) => ({
    id: `rec-${Date.now()}-${i}`,
    hazardId: hazards[i % hazards.length]?.id || `haz-${Date.now()}-0`, 
    title: r.title,
    description: r.description,
    priority: (r.priority === 'immediate' ? 'Critical' : r.priority === 'soon' ? 'High' : 'Medium') as any,
    estimatedCost: `$${r.estimatedCost.min} - $${r.estimatedCost.max}`,
    difficulty: 'Medium',
    expectedImpact: r.expectedImpact,
    whyDetected: r.whyDetected,
    objectsInvolved: r.objectsInvolved,
    certainty: r.certainty,
    falsePositivePossible: r.falsePositivePossible,
  }));
}
