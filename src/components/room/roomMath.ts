import type { ScanResult, Hazard } from "@/types/ai";

export const scoreColor = (score: number) => (score >= 85 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive");

export function conditionLabel(score: number): string {
  if (score >= 90) return "Excellent condition";
  if (score >= 75) return "Good condition";
  if (score >= 60) return "Fair condition";
  return "Needs attention";
}

/** The room-level equivalent of an executive summary — but comparing across
 * time, not just describing one report. Built entirely from real fields on
 * the latest and previous scans. */
export function buildRoomInsight(params: {
  roomType?: string;
  latest: ScanResult;
  previous?: ScanResult;
}): string {
  const { roomType, latest, previous } = params;
  const room = roomType ? roomType.toLowerCase() : "room";
  const topHazard = [...latest.hazards].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))[0];

  if (!previous) {
    if (latest.hazards.length === 0) {
      return `This is the first assessment of this ${room}, and it came back clear — no meaningful risks identified.`;
    }
    return `This is the first assessment of this ${room}. ${
      topHazard ? `The main concern is ${topHazard.title.toLowerCase()}.` : "A few small things are worth a look."
    }`;
  }

  const delta = latest.safetyScore - previous.safetyScore;

  if (delta > 0) {
    return `This ${room} is safer than it was at the previous assessment${delta >= 5 ? ", meaningfully so" : ""}. ${
      topHazard ? `Remaining concerns are concentrated around ${topHazard.location?.toLowerCase() || topHazard.title.toLowerCase()}.` : "Nothing else stands out right now."
    }`;
  }
  if (delta < 0) {
    return `This ${room} has changed since the last assessment, and not for the better. ${
      topHazard ? `The most pressing issue now is ${topHazard.title.toLowerCase()}.` : "Worth a closer look next time you're in the room."
    }`;
  }
  return `This ${room} looks about the same as the previous assessment. ${
    topHazard ? `${topHazard.title} is still the main thing worth addressing.` : "Nothing new has come up."
  }`;
}

function severityWeight(s: Hazard["severity"]): number {
  switch (s) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
}

/** A short "areas requiring attention" line for the calm Room Health
 * overview — summarizes hazard categories without another stat card. */
export function attentionSummary(hazards: Hazard[]): string {
  if (hazards.length === 0) return "Nothing right now";
  const categories = Array.from(new Set(hazards.map((h) => h.category)));
  if (categories.length === 1) return categories[0];
  if (categories.length === 2) return `${categories[0]} and ${categories[1]}`;
  return `${categories[0]}, ${categories[1]}, and ${categories.length - 2} more`;
}
