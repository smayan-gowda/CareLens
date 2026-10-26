import { Recommendation, Hazard } from "@/types/ai";
import { SafetyAnalysis } from "./schemas";

export function generateRecommendations(analysis: SafetyAnalysis, hazards: Hazard[]): Recommendation[] {
  return analysis.recommendations.map((r, i) => {
    const recommendationObjects = r.objectsInvolved.map((name) => name.toLowerCase());
    const relatedHazardIds = hazards
      .filter((hazard) =>
        hazard.objectsInvolved?.some((name) =>
          recommendationObjects.some(
            (recommendedName) =>
              recommendedName.includes(name.toLowerCase()) ||
              name.toLowerCase().includes(recommendedName)
          )
        )
      )
      .map((hazard) => hazard.id);

    return {
      id: `rec-${Date.now()}-${i}`,
      title: r.title,
      description: r.description,
      priority: (r.priority === 'immediate' ? 'Critical' : r.priority === 'soon' ? 'High' : 'Medium') as any,
      estimatedCost: `$${r.estimatedCost.min} - $${r.estimatedCost.max}`,
      difficulty: 'Medium' as const,
      expectedImpact: r.expectedImpact,
      whyDetected: r.whyDetected,
      objectsInvolved: r.objectsInvolved,
      certainty: r.certainty,
      falsePositivePossible: r.falsePositivePossible,
      relatedHazardIds,
    };
  });
}
