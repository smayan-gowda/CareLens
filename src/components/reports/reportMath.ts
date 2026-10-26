import { Hazard, Recommendation, HazardSeverity } from "@/types/ai";

export const DEDUCTION_RATES: Record<HazardSeverity, number> = {
  Critical: 15,
  High: 10,
  Medium: 5,
  Low: 2,
};

export interface ScoreFormulaBreakdown {
  base: number;
  criticalCount: number;
  criticalDeduction: number;
  highCount: number;
  highDeduction: number;
  mediumCount: number;
  mediumDeduction: number;
  lowCount: number;
  lowDeduction: number;
  totalDeductions: number;
  calculatedScore: number;
  reviewedNotPresentCount: number;
}

/**
 * Computes the original scan's deterministic deductions. User reviews do not
 * alter the score; they remain separate evidence about the model's findings.
 */
export function getScoreFormulaBreakdown(hazards: Hazard[]): ScoreFormulaBreakdown {
  const base = 100;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let reviewedNotPresentCount = 0;

  for (const h of hazards) {
    if (h.feedback === "not_present") {
      reviewedNotPresentCount++;
    }

    switch (h.severity) {
      case "Critical":
        criticalCount++;
        break;
      case "High":
        highCount++;
        break;
      case "Medium":
        mediumCount++;
        break;
      case "Low":
      default:
        lowCount++;
        break;
    }
  }

  const criticalDeduction = criticalCount * DEDUCTION_RATES.Critical;
  const highDeduction = highCount * DEDUCTION_RATES.High;
  const mediumDeduction = mediumCount * DEDUCTION_RATES.Medium;
  const lowDeduction = lowCount * DEDUCTION_RATES.Low;
  const totalDeductions = criticalDeduction + highDeduction + mediumDeduction + lowDeduction;
  const calculatedScore = Math.max(15, Math.min(100, base - totalDeductions));

  return {
    base,
    criticalCount,
    criticalDeduction,
    highCount,
    highDeduction,
    mediumCount,
    mediumDeduction,
    lowCount,
    lowDeduction,
    totalDeductions,
    calculatedScore,
    reviewedNotPresentCount,
  };
}

export function getRecordedAssessmentScore(scan: {
  initialSafetyScore?: number;
  safetyScore: number;
}): number {
  return scan.initialSafetyScore ?? scan.safetyScore;
}

/** Illustrative score scenario only; action statuses never modify measured scores. */
export function projectedScore(currentScore: number, recommendations: Recommendation[]): number {
  if (!recommendations || recommendations.length === 0) return currentScore;
  const pending = recommendations.filter((recommendation) => {
    const status =
      recommendation.actionStatus ??
      (recommendation.completedAt ? 'follow_up_due' : 'open');
    return status !== 'dismissed' && status !== 'verified';
  });
  if (pending.length === 0) return currentScore;
  const gain = pending.reduce((sum, r) => sum + (r.expectedImpact || 0), 0);
  return Math.min(100, Math.round(currentScore + gain));
}

/** A plausible, deterministic time estimate from a recommendation's difficulty rating */
export function estimatedTimeLabel(difficulty: Recommendation["difficulty"]): string {
  switch (difficulty) {
    case "Easy":
      return "Under an hour";
    case "Medium":
      return "An afternoon";
    case "Hard":
      return "A professional visit";
    default:
      return "Varies";
  }
}

export function severityColor(severity: HazardSeverity): string {
  switch (severity) {
    case "Critical":
      return "text-destructive";
    case "High":
      return "text-warning";
    case "Medium":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

export function severityLabel(severity: HazardSeverity): string {
  switch (severity) {
    case "Critical":
      return "Critical Concern";
    case "High":
      return "High Attention";
    case "Medium":
      return "Medium Advisory";
    default:
      return "Low / Minor Note";
  }
}

export function estimatedImprovement(hazard: Hazard, recommendations: Recommendation[]): number {
  const related = recommendations.find((r) => r.relatedHazardIds?.includes(hazard.id));
  if (related) return related.expectedImpact;
  switch (hazard.severity) {
    case "Critical":
      return 15;
    case "High":
      return 10;
    case "Medium":
      return 5;
    default:
      return 2;
  }
}

export function buildExecutiveSummary(params: {
  roomType?: string;
  safetyScore: number;
  hazards: Hazard[];
}): string {
  const { roomType, safetyScore, hazards } = params;
  const room = roomType ? roomType.toLowerCase() : "room";
  const activeHazards = hazards.filter((h) => h.feedback !== "not_present");
  const critical = activeHazards.filter((h) => h.severity === "Critical");
  const high = activeHazards.filter((h) => h.severity === "High");
  const topConcern = critical[0] || high[0] || activeHazards[0];

  if (activeHazards.length === 0) {
    return `No active visible hazards are currently flagged in this ${room}. Note that camera photos cannot assess non-visible factors such as structural anchor strength, floor slickness when wet, or concealed wiring.`;
  }

  const severityPhrase =
    critical.length > 0
      ? "a few urgent concerns that should be inspected promptly"
      : high.length > 0
      ? "several visible items worth addressing to prevent trips and slips"
      : "a few minor adjustments for improved accessibility";

  const concernPhrase = topConcern
    ? ` The primary item noted is ${topConcern.title.toLowerCase()}, which ${topConcern.impact ? topConcern.impact.toLowerCase() : "may impact footing or mobility"}.`
    : "";

  const scorePhrase =
    safetyScore >= 85
      ? "Overall, this space shows high baseline accessibility."
      : safetyScore >= 60
      ? "Overall, this space is functional but would benefit from targeted improvements."
      : "Overall, this room presents multiple points needing physical inspection and improvement.";

  return `This ${room} visual review identified ${severityPhrase}.${concernPhrase} ${scorePhrase}`;
}
