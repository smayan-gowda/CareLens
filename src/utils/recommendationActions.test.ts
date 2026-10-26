import { describe, expect, it } from 'vitest';
import type { Recommendation } from '@/types/ai';
import {
  appendRecommendationAction,
  getRecommendationActionStatus,
} from './recommendationActions';

const recommendation: Recommendation = {
  id: 'recommendation-1',
  title: 'Secure the rug',
  description: 'Check whether the rug can be secured.',
  priority: 'Medium',
  estimatedCost: 'Varies',
  difficulty: 'Easy',
  expectedImpact: 5,
};

describe('recommendation actions', () => {
  it('keeps every user status and note as an append-only action event', () => {
    const accepted = appendRecommendationAction(
      recommendation,
      'accepted',
      { note: 'Caregiver will handle it.' },
      'event-1',
      '2026-10-01T12:00:00.000Z'
    );
    const deferred = appendRecommendationAction(
      accepted,
      'deferred',
      { note: 'Wait for supplies.', deferredUntil: '2026-10-15' },
      'event-2',
      '2026-10-02T12:00:00.000Z'
    );

    expect(deferred.actionEvents).toHaveLength(2);
    expect(deferred.actionEvents?.[0].note).toBe('Caregiver will handle it.');
    expect(deferred.actionStatus).toBe('deferred');
    expect(deferred.deferredUntil).toBe('2026-10-15');
    expect(deferred.expectedImpact).toBe(recommendation.expectedImpact);

    const noteOnly = appendRecommendationAction(
      deferred,
      'deferred',
      { note: 'Date remains unchanged.' },
      'event-3',
      '2026-10-03T12:00:00.000Z'
    );
    expect(noteOnly.deferredUntil).toBe('2026-10-15');
    expect(noteOnly.actionEvents?.[2].deferredUntil).toBe('2026-10-15');
  });

  it('keeps completed work open for a linked follow-up and supports reopening', () => {
    const due = appendRecommendationAction(
      recommendation,
      'follow_up_due',
      {},
      'event-due',
      '2026-10-01T12:00:00.000Z'
    );
    const linked = appendRecommendationAction(
      due,
      'follow_up_due',
      { followUpScanId: 'scan-follow-up' },
      'event-linked',
      '2026-10-02T12:00:00.000Z'
    );
    const reopened = appendRecommendationAction(
      linked,
      'reopened',
      { followUpOutcome: 'still_needs_work' },
      'event-reopened',
      '2026-10-03T12:00:00.000Z'
    );

    expect(getRecommendationActionStatus(due)).toBe('follow_up_due');
    expect(linked.followUpScanId).toBe('scan-follow-up');
    expect(reopened.actionEvents).toHaveLength(3);
    expect(reopened.completedAt).toBeUndefined();
    expect(reopened.followUpOutcome).toBe('still_needs_work');
  });

  it('keeps legacy completed actions pending follow-up instead of marking them verified', () => {
    expect(
      getRecommendationActionStatus({
        ...recommendation,
        completedAt: '2026-10-01T12:00:00.000Z',
      })
    ).toBe('follow_up_due');
  });
});
