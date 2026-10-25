/**
 * Generates transparent, descriptive trade tags for directory listings,
 * connecting specific specialties to assessment recommendations without
 * fabricating uncalibrated percentage match scores.
 */
export function getMatchReasons(provider: any, latestScan: any): string[] {
  const reasons: string[] = [];

  const specialties: string[] = provider.specialties || [];
  reasons.push(...specialties.slice(0, 2));

  if (latestScan?.roomType) {
    reasons.push(`Relevant to ${latestScan.roomType} safety`);
  }

  if (provider.rating && provider.rating >= 4.0) {
    reasons.push(`Yelp Rating: ${provider.rating}★ (${provider.reviewsCount ?? 0} reviews)`);
  }

  if (provider.isYelp) {
    reasons.push("Verified Local Business Directory");
  }

  return Array.from(new Set(reasons)).slice(0, 3);
}

export function matchLabel(provider: any, latestScan: any): string {
  const searchable = [
    ...(provider.categories || []),
    ...(provider.specialties || []),
    provider.name || "",
  ]
    .join(" ")
    .toLowerCase();

  if (latestScan?.recommendations) {
    for (const rec of latestScan.recommendations) {
      const title = (rec.title || "").toLowerCase();
      if (
        (searchable.includes("grab") || searchable.includes("rail")) &&
        (title.includes("grab") || title.includes("rail") || title.includes("bar"))
      ) {
        return "Specialty: Grab Bars & Handrails";
      }
      if (
        (searchable.includes("floor") || searchable.includes("carpet") || searchable.includes("tile")) &&
        (title.includes("floor") || title.includes("slip") || title.includes("rug"))
      ) {
        return "Specialty: Slip-Resistant Flooring";
      }
      if (
        (searchable.includes("light") || searchable.includes("electric")) &&
        (title.includes("light") || title.includes("illumination") || title.includes("sensor"))
      ) {
        return "Specialty: Pathway Lighting";
      }
    }
  }

  if (searchable.includes("plumb")) return "Trade: Bathroom & Plumbing";
  if (searchable.includes("electric")) return "Trade: Electrical & Lighting";
  if (searchable.includes("handyman") || searchable.includes("contractor")) return "Trade: Home Accessibility";

  return "Local Directory Reference";
}
