/** Turns a provider's already-computed specialties + match score into a
 * short list of concrete reasons, so "92% Match" becomes something a person
 * can actually evaluate. Purely derived from data that's already fetched —
 * no new API calls, no change to calculateMatchScore itself. */
export function getMatchReasons(provider: any, latestScan: any): string[] {
  const reasons: string[] = [];

  const specialties: string[] = provider.specialties || [];
  reasons.push(...specialties.slice(0, 3));

  if (latestScan?.roomType) {
    reasons.push(`Relevant to your ${latestScan.roomType} assessment`);
  }

  if (provider.rating >= 4.5) {
    reasons.push(`Highly rated (${provider.rating}★, ${provider.reviewsCount ?? 0} reviews)`);
  }

  reasons.push("Serves your neighborhood");

  return Array.from(new Set(reasons)).slice(0, 4);
}

export function matchLabel(score: number): string {
  if (score >= 90) return "Excellent Match";
  if (score >= 80) return "Strong Match";
  if (score >= 70) return "Good Match";
  return "Possible Match";
}
