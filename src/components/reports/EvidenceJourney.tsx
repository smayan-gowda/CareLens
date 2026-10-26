import { ArrowDownRight, Camera, CheckCircle2, CircleHelp, Eye, GitBranch, ScanLine, ShieldAlert, Wrench } from 'lucide-react';
import type {
  DetectedObject,
  EvidenceReview,
  Hazard,
  Recommendation,
  ScanPhoto,
  SpatialFinding,
} from '@/types/ai';
import { getRecommendationActionStatus } from '@/utils/recommendationActions';

interface EvidenceJourneyProps {
  photos: Array<ScanPhoto & { image: string }>;
  detectedObjects: DetectedObject[];
  spatialFindings: SpatialFinding[];
  hazards: Hazard[];
  recommendations: Recommendation[];
  evidenceReviews: EvidenceReview[];
  onOpenPhoto: (photoId: string) => void;
  onReviewPhoto: (photoId: string, hazardId?: string, spatialFindingId?: string) => void;
  onOpenActionPlan: () => void;
}

function EvidenceCount({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof Eye;
  label: string;
  count: number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background p-3">
      <Icon className="mb-2 h-4 w-4 text-brand" aria-hidden="true" />
      <div className="text-xl font-semibold tabular">{count}</div>
      <div className="text-[11px] leading-snug text-muted-foreground">{label}</div>
    </div>
  );
}

export function EvidenceJourney({
  photos,
  detectedObjects,
  spatialFindings,
  hazards,
  recommendations,
  evidenceReviews,
  onOpenPhoto,
  onReviewPhoto,
  onOpenActionPlan,
}: EvidenceJourneyProps) {
  const reviewedIds = new Set(evidenceReviews.map((review) => review.targetId));
  const latestReviewByTarget = new Map(
    [...evidenceReviews]
      .sort((first, second) => first.reviewedAt.localeCompare(second.reviewedAt))
      .map((review) => [review.targetId, review])
  );
  const unlinkedRecommendations = recommendations.filter((recommendation) => {
    const hasObservation = Boolean(recommendation.observationIds?.length);
    const hasHazard = Boolean(recommendation.relatedHazardIds?.length);
    const hasSpatialFinding = Boolean(recommendation.spatialFindingIds?.length);
    return !hasObservation && !hasHazard && !hasSpatialFinding;
  }).length;
  const photoUnassignedRecommendations = recommendations.filter(
    (recommendation) =>
      !recommendation.imageId && !recommendation.evidencePhotoIds?.length
  ).length;
  const unresolvedReviewCount = [...hazards, ...spatialFindings].filter((finding) => {
    const latestReview = latestReviewByTarget.get(finding.id);
    return !latestReview || latestReview.status === 'needs_review';
  }).length;
  const activeActionCount = recommendations.filter(
    (recommendation) => !['verified', 'dismissed'].includes(getRecommendationActionStatus(recommendation))
  ).length;
  const followUpDueCount = recommendations.filter(
    (recommendation) => getRecommendationActionStatus(recommendation) === 'follow_up_due'
  ).length;

  return (
    <section
      id="evidence-journey"
      className="scroll-mt-24 space-y-6 border-y border-border py-10"
      aria-labelledby="evidence-journey-title"
    >
      <header className="max-w-3xl space-y-2">
        <div className="flex items-center gap-2 text-brand">
          <GitBranch className="h-4 w-4" aria-hidden="true" />
          <span className="field-tag">CareLens evidence trail</span>
        </div>
        <h2 id="evidence-journey-title" className="text-2xl font-semibold tracking-tight">
          From room photos to reviewed actions
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each photo remains its own evidence source. Follow its detections into image-coordinate
          relationships, potential concerns, your review, and any linked next step—without treating a
          model finding as a verified physical condition.
        </p>
      </header>

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
          No source photos were saved with this assessment, so its evidence trail cannot be reconstructed.
        </div>
      ) : (
        <ol className="space-y-4">
          {photos.map((photo, index) => {
            const isLegacyOverview = index === 0;
            const observations = detectedObjects.filter(
              (object) => object.imageId === photo.id || (!object.imageId && isLegacyOverview)
            );
            const relations = spatialFindings.filter(
              (finding) => finding.imageId === photo.id || (!finding.imageId && isLegacyOverview)
            );
            const photoHazards = hazards.filter(
              (hazard) => hazard.imageId === photo.id || (!hazard.imageId && isLegacyOverview)
            );
            const photoRecommendations = recommendations.filter(
              (recommendation) =>
                recommendation.evidencePhotoIds?.includes(photo.id) ||
                recommendation.imageId === photo.id
            );
            const reviewableIds = [
              ...photoHazards.map((hazard) => hazard.id),
              ...relations.map((finding) => finding.id),
            ];
            const reviewedCount = reviewableIds.filter((id) => reviewedIds.has(id)).length;
            const reviewTargetHazard =
              photoHazards.find((hazard) => latestReviewByTarget.get(hazard.id)?.status === 'needs_review') ??
              photoHazards.find((hazard) => !reviewedIds.has(hazard.id)) ??
              photoHazards[0];
            const reviewTargetRelation = reviewTargetHazard
              ? undefined
              : relations.find((finding) => latestReviewByTarget.get(finding.id)?.status === 'needs_review') ??
                relations.find((finding) => !reviewedIds.has(finding.id)) ??
                relations[0];
            const completedActions = photoRecommendations.filter((recommendation) =>
              ['verified', 'dismissed'].includes(getRecommendationActionStatus(recommendation))
            ).length;
            const sourceCount = photoRecommendations.filter((recommendation) => {
              const sourceObservationIds = new Set(observations.map((object) => object.id));
              const sourceFindingIds = new Set(relations.map((finding) => finding.id));
              const sourceHazardIds = new Set(photoHazards.map((hazard) => hazard.id));
              return Boolean(
                recommendation.observationIds?.some((id) => sourceObservationIds.has(id)) ||
                recommendation.spatialFindingIds?.some((id) => sourceFindingIds.has(id)) ||
                recommendation.relatedHazardIds?.some((id) => sourceHazardIds.has(id))
              );
            }).length;

            return (
              <li key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid gap-0 md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.6fr)]">
                  <button
                    type="button"
                    onClick={() => onOpenPhoto(photo.id)}
                    className="group relative min-h-48 overflow-hidden border-b border-border text-left md:min-h-full md:border-b-0 md:border-r"
                    aria-label={`Inspect evidence from ${photo.label}, ${photo.role} photo`}
                  >
                    <img
                      src={photo.image}
                      alt={`${photo.label} source photo`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <span className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/75">
                        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                        Photo {String(index + 1).padStart(2, '0')} · {photo.role}
                      </span>
                      <span className="mt-1 block text-lg font-semibold">{photo.label}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-white/80">
                        Inspect source photo <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </span>
                  </button>

                  <div className="space-y-4 p-4 md:p-5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <EvidenceCount icon={ScanLine} label="Visual observations" count={observations.length} />
                      <EvidenceCount icon={GitBranch} label="Spatial relationships" count={relations.length} />
                      <EvidenceCount icon={ShieldAlert} label="Potential concerns" count={photoHazards.length} />
                      <EvidenceCount icon={Wrench} label="Linked actions" count={photoRecommendations.length} />
                    </div>

                    <div className="flex flex-col justify-between gap-3 rounded-lg bg-muted/35 p-3 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-2.5">
                        {reviewedCount === reviewableIds.length && reviewableIds.length > 0 ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        ) : (
                          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {reviewedCount} of {reviewableIds.length} concerns and relationships reviewed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sourceCount} of {photoRecommendations.length} actions link to a recorded observation,
                            relationship, or concern. {completedActions} actions closed or verified.
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPhoto(photo.id)}
                          className="rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
                        >
                          View photo
                        </button>
                        {(reviewTargetHazard || reviewTargetRelation) && (
                          <button
                            type="button"
                            onClick={() => onReviewPhoto(
                              photo.id,
                              reviewTargetHazard?.id,
                              reviewTargetRelation?.id
                            )}
                            className="rounded-md bg-brand px-3 py-2 text-xs font-medium text-brand-foreground transition-colors hover:brightness-105"
                          >
                            Review {reviewTargetHazard?.title ??
                              reviewTargetRelation?.relationType.replaceAll('-', ' ')}
                          </button>
                        )}
                        {photoRecommendations.length > 0 && (
                          <button
                            type="button"
                            onClick={onOpenActionPlan}
                            className="rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
                          >
                            Open action plan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {unlinkedRecommendations > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {unlinkedRecommendations} action{unlinkedRecommendations === 1 ? ' has' : 's have'} no explicit
          observation, concern, or spatial-record link. Those suggestions remain visible, but the report
          does not claim a supporting evidence chain that was not recorded.
        </p>
      )}
      {photoUnassignedRecommendations > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {photoUnassignedRecommendations} recommendation{photoUnassignedRecommendations === 1 ? ' has' : 's have'} no
          recorded source photo. Older reports may also lack stable photo-to-observation links; unscoped legacy
          observations are shown under the overview only and are not treated as cross-photo matches.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 p-4">
        <span className="mr-auto text-sm text-foreground">
          {followUpDueCount > 0
            ? `Next: review ${followUpDueCount} follow-up action${followUpDueCount === 1 ? '' : 's'} against the new room photos.`
            : unresolvedReviewCount > 0
              ? `Next: review ${unresolvedReviewCount} finding${unresolvedReviewCount === 1 ? '' : 's'}, then decide which actions belong in your plan.`
              : activeActionCount > 0
                ? `Evidence review is up to date. Next: update your ${activeActionCount} active action${activeActionCount === 1 ? '' : 's'} and schedule a follow-up check.`
                : 'Evidence review is up to date. Run another room scan after changes to reassess the space.'}
        </span>
        <button
          type="button"
          onClick={onOpenActionPlan}
          className="rounded-md bg-brand px-3 py-2 text-xs font-medium text-brand-foreground transition-colors hover:brightness-105"
        >
          {followUpDueCount > 0 ? 'Review follow-up actions' : activeActionCount > 0 ? 'Open action plan' : 'View recommendations'}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Photo coordinate relationships are not room measurements or floor plans. User reviews and action
        statuses are recorded separately from model-generated evidence and do not by themselves change the
        assessment score.
      </p>
    </section>
  );
}
