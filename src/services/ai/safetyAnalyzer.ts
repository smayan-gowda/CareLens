import { Hazard } from "@/types/ai";
import { SafetyAnalysis } from "./schemas";

export function extractHazards(analysis: SafetyAnalysis, scanId: string): Hazard[] {
  return analysis.hazards.map((h, i) => ({
    id: `haz-${Date.now()}-${i}`,
    scanId,
    title: h.title,
    severity: (h.severity.charAt(0).toUpperCase() + h.severity.slice(1)) as any,
    confidence: h.confidence,
    description: h.description,
    location: h.location,
    category: h.category as any,
    impact: `This presents a ${h.severity} risk.`,
    objectsInvolved: h.objectsInvolved,
    reasoning: h.reasoning,
    boundingBox: h.boundingBox,
    detectedObjectId: '', 
  }));
}
