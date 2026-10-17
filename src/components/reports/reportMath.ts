import { Hazard, Recommendation, HazardSeverity } from "@/types/ai";

/** How much finishing remaining open recommendations could plausibly raise the
 * score — excludes already completed recommendations. */
export function projectedScore(currentScore: number, recommendations: Recommendation[]): number {
  if (!recommendations || recommendations.length === 0) return currentScore;
  const pending = recommendations.filter((r) => !r.completedAt);
  if (pending.length === 0) return currentScore;
  const gain = pending.reduce((sum, r) => sum + (r.expectedImpact || 0), 0);
  return Math.min(100, Math.round(currentScore + gain));
}

/** A plausible, deterministic time estimate from a recommendation's
 * difficulty rating — there's no time field in the data model, so this is
 * derived rather than invented per-item. */
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
      return "Critical risk";
    case "High":
      return "High risk";
    case "Medium":
      return "Medium risk";
    default:
      return "Low risk";
  }
}

/** The per-finding "estimated improvement" — matched to a related
 * recommendation when one references this hazard, otherwise a conservative
 * fallback keyed to severity so every finding still reads as quantified. */
export function estimatedImprovement(hazard: Hazard, recommendations: Recommendation[]): number {
  const related = recommendations.find((r) => r.relatedHazardIds?.includes(hazard.id));
  if (related) return related.expectedImpact;
  switch (hazard.severity) {
    case "Critical":
      return 12;
    case "High":
      return 8;
    case "Medium":
      return 4;
    default:
      return 2;
  }
}

/** Composes a short, human paragraph from the scan's real data — this is
 * string templating over existing fields, not a new data source. */
export function buildExecutiveSummary(params: {
  roomType?: string;
  safetyScore: number;
  hazards: Hazard[];
}): string {
  const { roomType, safetyScore, hazards } = params;
  const room = roomType ? roomType.toLowerCase() : "room";
  const critical = hazards.filter((h) => h.severity === "Critical");
  const high = hazards.filter((h) => h.severity === "High");
  const topConcern = critical[0] || high[0] || hazards[0];

  if (hazards.length === 0) {
    return `This ${room} provides a genuinely safe environment. Lighting, clearances, and footing all fall within a comfortable range, and no meaningful risks stood out during review.`;
  }

  const severityPhrase =
    critical.length > 0
      ? "a few concerns that are worth addressing promptly"
      : high.length > 0
      ? "some concerns worth addressing before they become a habit to work around"
      : "a couple of small, easily manageable details";

  const concernPhrase = topConcern
    ? ` The most notable is ${topConcern.title.toLowerCase()}, which ${topConcern.impact ? topConcern.impact.toLowerCase() : "increases risk more than its size would suggest"}.`
    : "";

  const scorePhrase =
    safetyScore >= 85
      ? "Overall, this space is in good standing."
      : safetyScore >= 60
      ? "Overall, this space is functional but would benefit from a little attention."
      : "Overall, this space would benefit from prompt attention.";

  return `This ${room} is generally well set up, with ${severityPhrase}.${concernPhrase} ${scorePhrase}`;
}
