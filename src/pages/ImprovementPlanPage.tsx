import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHomeStore } from '@/stores/useHomeStore';
import { useScanStore } from '@/stores/scanStore';
import { RecommendationActionControls } from '@/components/plan/RecommendationActionControls';
import type { Recommendation, RecommendationActionStatus, ScanResult } from '@/types/ai';
import { getRecommendationActionStatus } from '@/utils/recommendationActions';

type PlanFilter = 'active' | 'closed';

interface PlanItem {
  recommendation: Recommendation;
  scan: ScanResult;
  homeName: string;
  roomName: string;
  roomType: string;
}

const statusText: Record<RecommendationActionStatus, string> = {
  open: 'Not started',
  accepted: 'Accepted',
  deferred: 'Deferred',
  dismissed: 'Dismissed',
  follow_up_due: 'Follow-up check needed',
  verified: 'Verified on follow-up',
  reopened: 'Reopened',
};

export function ImprovementPlanPage() {
  const { scans, loading } = useScanStore();
  const { homes } = useHomeStore();
  const [filter, setFilter] = useState<PlanFilter>('active');

  const planItems = useMemo<PlanItem[]>(() => {
    return Object.values(scans)
      .flat()
      .filter((scan) => scan.status === 'Completed')
      .flatMap((scan) => {
        const home = homes.find((item) => item.id === scan.homeId);
        const room = home?.rooms.find((item) => item.id === scan.roomId);
        return (scan.recommendations ?? []).map((recommendation) => ({
          recommendation,
          scan,
          homeName: home?.name ?? 'Property',
          roomName: room?.name ?? scan.roomType ?? 'Room',
          roomType: room?.type ?? scan.roomType ?? 'Room',
        }));
      })
      .sort((a, b) => {
        const statusOrder: Record<RecommendationActionStatus, number> = {
          follow_up_due: 0,
          reopened: 1,
          open: 2,
          accepted: 3,
          deferred: 4,
          dismissed: 5,
          verified: 6,
        };
        const statusDifference =
          statusOrder[getRecommendationActionStatus(a.recommendation)] -
          statusOrder[getRecommendationActionStatus(b.recommendation)];
        return statusDifference || b.scan.createdAt.localeCompare(a.scan.createdAt);
      });
  }, [scans, homes]);

  const activeItems = planItems.filter(
    ({ recommendation }) =>
      getRecommendationActionStatus(recommendation) !== 'dismissed' &&
      getRecommendationActionStatus(recommendation) !== 'verified'
  );
  const closedItems = planItems.filter(
    ({ recommendation }) =>
      getRecommendationActionStatus(recommendation) === 'dismissed' ||
      getRecommendationActionStatus(recommendation) === 'verified'
  );
  const visibleItems = filter === 'active' ? activeItems : closedItems;
  const followUpCount = activeItems.filter(
    ({ recommendation }) => getRecommendationActionStatus(recommendation) === 'follow_up_due'
  ).length;

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground">Loading your improvement plan…</div>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-4 border-b border-border pb-8">
        <div className="flex items-center gap-2 text-brand">
          <ClipboardList className="h-4 w-4" />
          <span className="field-tag">Across your home</span>
        </div>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Improvement plan</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              One place for actions from every room. Accept, schedule, or dismiss a suggestion;
              actions stay open until you complete a follow-up check.
            </p>
          </div>
          <div className="flex gap-5 text-sm">
            <div>
              <span className="block text-2xl font-semibold tabular">{activeItems.length}</span>
              <span className="text-xs text-muted-foreground">open actions</span>
            </div>
            <div>
              <span className="block text-2xl font-semibold tabular">{followUpCount}</span>
              <span className="text-xs text-muted-foreground">follow-ups due</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Completing or verifying an action does not change the measured safety score. Only a new room assessment
          provides new score evidence.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Improvement plan actions">
        <Button
          type="button"
          role="tab"
          aria-selected={filter === 'active'}
          variant={filter === 'active' ? 'brand' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Open actions ({activeItems.length})
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={filter === 'closed'}
          variant={filter === 'closed' ? 'brand' : 'outline'}
          onClick={() => setFilter('closed')}
        >
          Verified & dismissed ({closedItems.length})
        </Button>
      </div>

      {visibleItems.length === 0 ? (
        <div className="border-y border-border py-16 text-center">
          {filter === 'active' ? (
            <>
              <CheckCircle2 className="mx-auto mb-4 h-7 w-7 text-success" />
              <h2 className="text-xl font-medium">No open actions</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                New recommendations from room assessments will appear here. Verified actions stay available in your history.
              </p>
            </>
          ) : (
            <>
              <Clock3 className="mx-auto mb-4 h-7 w-7 text-muted-foreground" />
              <h2 className="text-xl font-medium">No closed actions yet</h2>
            </>
          )}
        </div>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {visibleItems.map(({ recommendation, scan, homeName, roomName, roomType }) => {
            const status = getRecommendationActionStatus(recommendation);
            const lastNote = recommendation.actionEvents?.[recommendation.actionEvents.length - 1]?.note;
            return (
              <li key={`${scan.id}-${recommendation.id}`} className="space-y-5 py-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{homeName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{roomName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{roomType}</span>
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">{recommendation.title}</h2>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {recommendation.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2.5 py-1">{statusText[status]}</span>
                      <span>{recommendation.priority} priority</span>
                      <span>Added from {new Date(scan.createdAt).toLocaleDateString()}</span>
                      {recommendation.deferredUntil && status === 'deferred' && (
                        <span>Revisit {new Date(`${recommendation.deferredUntil}T12:00:00`).toLocaleDateString()}</span>
                      )}
                    </div>
                    {lastNote && (
                      <p className="border-l-2 border-brand/40 pl-3 text-sm text-muted-foreground">
                        Latest note: {lastNote}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" asChild className="shrink-0">
                    <Link to={`/properties/${scan.homeId}/rooms/${scan.roomId}/assessments/${scan.id}`}>
                      Open assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <RecommendationActionControls
                  recommendation={recommendation}
                  scanId={scan.id}
                  homeId={scan.homeId}
                  roomId={scan.roomId}
                />
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
