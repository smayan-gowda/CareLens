import { Hazard } from "@/types/ai";
import { SafetyAnalysis } from "./schemas";

export function extractHazards(analysis: SafetyAnalysis, scanId: string): Hazard[] {
  return analysis.hazards.map((h, i) => {
    const severity = (h.severity.charAt(0).toUpperCase() + h.severity.slice(1)) as any;
    const visibleObs = h.visibleObservation || h.description || "Visible item observed in current camera view";
    const potConcern = h.potentialConcern || h.reasoning || `Presents a ${severity} risk for balance loss or physical obstruction.`;
    const verifReq = h.verificationRequirement || "In-person physical check required to verify mounting firmness, surface friction, or clearance.";
    const limit = h.limitations || "2D photo analysis cannot evaluate load capacity, wet surface grip, or concealed electrical wiring.";
    const nextStep = h.suggestedNextStep || "Review finding with resident or primary caregiver and conduct physical verification.";

    return {
      id: `haz-${Date.now()}-${i}`,
      title: h.title,
      severity,
      confidence: h.confidence,
      description: h.description,
      visibleObservation: visibleObs,
      potentialConcern: potConcern,
      verificationRequirement: verifReq,
      limitations: limit,
      suggestedNextStep: nextStep,
      location: h.location,
      category: h.category as any,
      impact: potConcern,
      objectsInvolved: h.objectsInvolved,
      reasoning: h.reasoning || visibleObs,
      boundingBox: h.boundingBox,
      feedback: 'needs_review',
      reviewStatus: 'unresolved',
      humanVerificationNote: verifReq,
      suggestedAction: nextStep,
    };
  });
}
