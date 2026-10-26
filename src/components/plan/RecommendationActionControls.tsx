import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useScanStore } from '@/stores/scanStore';
import type { Recommendation, RecommendationActionStatus } from '@/types/ai';
import { getRecommendationActionStatus } from '@/utils/recommendationActions';
import { toast } from 'sonner';

interface RecommendationActionControlsProps {
  recommendation: Recommendation;
  scanId: string;
  homeId: string;
  roomId: string;
}

const statusLabels: Record<RecommendationActionStatus, string> = {
  open: 'Not started',
  accepted: 'Accepted',
  deferred: 'Deferred',
  dismissed: 'Dismissed',
  follow_up_due: 'Follow-up check needed',
  verified: 'Verified on follow-up',
  reopened: 'Reopened after follow-up',
};

export function RecommendationActionControls({
  recommendation,
  scanId,
  homeId,
  roomId,
}: RecommendationActionControlsProps) {
  const navigate = useNavigate();
  const updateRecommendationAction = useScanStore((state) => state.updateRecommendationAction);
  const [note, setNote] = useState(
    recommendation.actionEvents?.[recommendation.actionEvents.length - 1]?.note ?? ''
  );
  const [deferredUntil, setDeferredUntil] = useState(recommendation.deferredUntil ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const status = getRecommendationActionStatus(recommendation);
  const latestEvent = recommendation.actionEvents?.[recommendation.actionEvents.length - 1];
  const noteChanged = note.trim() !== (latestEvent?.note ?? '');
  const today = new Date().toISOString().slice(0, 10);

  const saveAction = async (
    nextStatus: RecommendationActionStatus,
    extras: {
      deferredUntil?: string;
      followUpScanId?: string;
      followUpOutcome?: Recommendation['followUpOutcome'];
    } = {}
  ) => {
    setIsSaving(true);
    try {
      await updateRecommendationAction(scanId, recommendation.id, nextStatus, {
        note,
        ...extras,
      });
      toast.success(`Action updated: ${statusLabels[nextStatus]}`);
    } catch {
      toast.error("Couldn't save this action. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const followUpUrl =
    `/properties/${homeId}/rooms/${roomId}/scan` +
    `?followUpScanId=${encodeURIComponent(scanId)}` +
    `&followUpRecommendationId=${encodeURIComponent(recommendation.id)}`;

  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-background p-4"
      aria-label={`Action plan for ${recommendation.title}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Action plan</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {statusLabels[status]}
          {status === 'deferred' && recommendation.deferredUntil
            ? ` · until ${new Date(`${recommendation.deferredUntil}T12:00:00`).toLocaleDateString()}`
            : ''}
        </span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Action notes</span>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Add context, who will handle it, or what to check next."
          disabled={isSaving}
        />
      </label>
      {noteChanged && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSaving}
          onClick={() => saveAction(status)}
        >
          Save note
        </Button>
      )}

      {status !== 'dismissed' && status !== 'verified' && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={status === 'accepted' ? 'secondary' : 'outline'}
            disabled={isSaving || status === 'accepted'}
            onClick={() => saveAction('accepted')}
          >
            Accept
          </Button>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              aria-label="Defer until"
              min={today}
              value={deferredUntil}
              onChange={(event) => setDeferredUntil(event.target.value)}
              className="h-9 w-36 text-xs"
              disabled={isSaving}
            />
            <Button
              type="button"
              size="sm"
              variant={status === 'deferred' ? 'secondary' : 'outline'}
              disabled={isSaving || !deferredUntil}
              onClick={() => saveAction('deferred', { deferredUntil })}
            >
              Defer
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={() => saveAction('dismissed')}
          >
            Dismiss
          </Button>
          {status !== 'follow_up_due' && (
            <Button
              type="button"
              size="sm"
              variant="brand"
              disabled={isSaving}
              onClick={() => saveAction('follow_up_due')}
            >
              Mark work done · verify with a scan
            </Button>
          )}
        </div>
      )}

      {status === 'follow_up_due' && (
        <div className="space-y-2 rounded-md border border-brand/20 bg-brand/5 p-3">
          <p className="text-sm font-medium">This stays open until you review a follow-up room scan.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            A missing finding is not proof the work succeeded. Compare the photos, then choose whether to verify or reopen this action.
          </p>
          {!recommendation.followUpScanId ? (
            <Button
              type="button"
              size="sm"
              variant="brand"
              disabled={isSaving}
              onClick={() => navigate(followUpUrl)}
            >
              Start follow-up room check
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate(`/properties/${homeId}/rooms/${roomId}/assessments/${recommendation.followUpScanId}`)}
              >
                View follow-up assessment
              </Button>
              <Button
                type="button"
                size="sm"
                variant="brand"
                disabled={isSaving}
                onClick={() => saveAction('verified', { followUpOutcome: 'verified' })}
              >
                Follow-up confirms improvement
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() =>
                  saveAction('reopened', { followUpOutcome: 'still_needs_work' })
                }
              >
                Still needs work
              </Button>
            </div>
          )}
        </div>
      )}

      {(status === 'dismissed' || status === 'verified') && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSaving}
          onClick={() => saveAction('reopened')}
        >
          Reopen action
        </Button>
      )}

      {recommendation.actionEvents && recommendation.actionEvents.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="w-fit cursor-pointer font-medium">Action history ({recommendation.actionEvents.length})</summary>
          <ol className="mt-2 space-y-2 border-l border-border pl-3">
            {[...recommendation.actionEvents].reverse().map((event) => (
              <li key={event.id}>
                <span className="font-medium text-foreground">{statusLabels[event.status]}</span>
                {' · '}
                {new Date(event.createdAt).toLocaleString()}
                {event.note ? <p className="mt-0.5">{event.note}</p> : null}
                {event.deferredUntil ? <p>Deferred until {new Date(`${event.deferredUntil}T12:00:00`).toLocaleDateString()}</p> : null}
                {event.followUpScanId ? <p>Follow-up scan: {event.followUpScanId}</p> : null}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
