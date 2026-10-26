import type {
  Recommendation,
  RecommendationActionEvent,
  RecommendationActionStatus,
} from '@/types/ai';

export type RecommendationActionDetails = {
  note?: string;
  deferredUntil?: string;
  followUpScanId?: string;
  followUpOutcome?: Recommendation['followUpOutcome'];
};

export function getRecommendationActionStatus(
  recommendation: Recommendation
): RecommendationActionStatus {
  if (recommendation.actionStatus) return recommendation.actionStatus;
  return recommendation.completedAt ? 'follow_up_due' : 'open';
}

export function appendRecommendationAction(
  recommendation: Recommendation,
  status: RecommendationActionStatus,
  details: RecommendationActionDetails = {},
  eventId = `action-${crypto.randomUUID()}`,
  createdAt = new Date().toISOString()
): Recommendation {
  const deferredUntil =
    status === 'deferred' ? details.deferredUntil ?? recommendation.deferredUntil : undefined;
  const event: RecommendationActionEvent = {
    id: eventId,
    status,
    createdAt,
    origin: 'user',
    note: details.note?.trim() || undefined,
    deferredUntil,
    followUpScanId: details.followUpScanId,
  };

  const currentStatus = getRecommendationActionStatus(recommendation);
  const followUpScanId =
    details.followUpScanId ??
    (status === 'follow_up_due' && currentStatus !== 'follow_up_due'
      ? undefined
      : recommendation.followUpScanId);

  return {
    ...recommendation,
    actionStatus: status,
    actionEvents: [...(recommendation.actionEvents ?? []), event],
    deferredUntil,
    completedAt:
      status === 'follow_up_due' || status === 'verified'
        ? recommendation.completedAt ?? createdAt
        : status === 'reopened'
          ? undefined
          : recommendation.completedAt,
    followUpScanId,
    followUpOutcome:
      details.followUpOutcome ??
      (status === 'follow_up_due' ? undefined : recommendation.followUpOutcome),
  };
}
