import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, CircleHelp, Eye, Sparkles } from 'lucide-react';
import type { ScanResult } from '@/types/ai';
import { compareAssessments, type ComparisonFindingStatus } from '@/utils/assessmentComparison';

interface AssessmentComparisonProps {
  before: ScanResult;
  after: ScanResult;
}

const statusPresentation: Record<
  ComparisonFindingStatus,
  { label: string; icon: typeof Eye; tone: string }
> = {
  still_reported: {
    label: 'Still reported',
    icon: Eye,
    tone: 'border-warning/30 bg-warning/10 text-warning',
  },
  possibly_changed: {
    label: 'Possibly changed · review',
    icon: Sparkles,
    tone: 'border-brand/30 bg-brand/10 text-brand',
  },
  uncertain_view: {
    label: 'Uncertain · different view',
    icon: CircleHelp,
    tone: 'border-border bg-muted text-muted-foreground',
  },
  newly_detected: {
    label: 'Newly detected',
    icon: AlertTriangle,
    tone: 'border-warning/30 bg-warning/10 text-warning',
  },
};

export function AssessmentComparison({ before, after }: AssessmentComparisonProps) {
  const comparison = useMemo(() => compareAssessments(before, after), [before, after]);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [selectedBeforePhotoId, setSelectedBeforePhotoId] = useState('');
  const [selectedAfterPhotoId, setSelectedAfterPhotoId] = useState('');
  const selectedFinding =
    comparison.findings.find((finding) => finding.id === selectedFindingId) ??
    comparison.findings[0];

  useEffect(() => {
    setSelectedFindingId('');
    setSelectedBeforePhotoId('');
    setSelectedAfterPhotoId('');
  }, [before.id, after.id]);

  const beforePhoto =
    comparison.beforePhotos.find(
      (photo) =>
        photo.id ===
        (selectedBeforePhotoId || selectedFinding?.beforeImageId)
    ) ??
    comparison.beforePhotos[0];
  const afterPhoto =
    comparison.afterPhotos.find(
      (photo) =>
        photo.id ===
        (selectedAfterPhotoId || selectedFinding?.afterImageId)
    ) ??
    comparison.afterPhotos[0];
  const linkedAction = after.followUpRecommendationId
    ? before.recommendations.find(
        (recommendation) => recommendation.id === after.followUpRecommendationId
      )
    : undefined;

  return (
    <section aria-labelledby="assessment-comparison-title" className="space-y-6 border-y border-border py-10">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-brand">
          <ArrowLeftRight className="h-4 w-4" />
          <span className="field-tag">Repeat-scan comparison</span>
        </div>
        <h2 id="assessment-comparison-title" className="text-2xl font-semibold tracking-tight">
          What looks different this time?
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Compared with {new Date(before.createdAt).toLocaleDateString()}, this scan rechecks the earlier
          visual findings. Matching uses finding type and wording—not tracked physical objects.
        </p>
        <div className="flex gap-3 rounded-lg border border-warning/25 bg-warning/5 p-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            A finding missing from a photo is <strong>not proof it was fixed</strong>. Camera angle,
            framing, lighting, and occlusion can hide the same condition. “Possibly changed” is only
            a prompt for a person to review both images; no safety score is changed by this comparison.
          </p>
        </div>
        {linkedAction && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <span className="font-medium">Linked action: {linkedAction.title}</span>
            <p className="mt-1 text-muted-foreground">
              Action record: {linkedAction.followUpOutcome === 'verified'
                ? 'you marked this action verified'
                : linkedAction.followUpOutcome === 'still_needs_work'
                  ? 'you marked that work is still needed'
                  : 'awaiting your review'}.
              This is a user-entered disposition, not an automatic conclusion from image comparison.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.8fr)]">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {[
            { title: 'Earlier scan', photo: beforePhoto },
            { title: 'Follow-up scan', photo: afterPhoto },
          ].map(({ title, photo }, index) => {
            const photos = index === 0 ? comparison.beforePhotos : comparison.afterPhotos;
            const setPhotoId = index === 0 ? setSelectedBeforePhotoId : setSelectedAfterPhotoId;
            return (
              <figure key={title} className="min-w-0 space-y-2">
                <figcaption className="flex min-h-10 flex-col justify-center">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">
                    {photo
                      ? `${new Date(index === 0 ? before.createdAt : after.createdAt).toLocaleDateString()} · ${photo.label} · ${photo.role}`
                      : 'No photo available'}
                  </span>
                </figcaption>
                {photos.length > 1 && (
                  <select
                    aria-label={`Choose ${title.toLowerCase()} photo`}
                    value={photo?.id ?? ''}
                    onChange={(event) => setPhotoId(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {photos.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} · {option.role}
                      </option>
                    ))}
                  </select>
                )}
                {photo ? (
                  <img
                    src={photo.image}
                    alt={`${title}: ${photo.label}`}
                    className="aspect-[4/3] w-full rounded-md border border-border bg-muted object-contain"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                    No image was saved for this scan.
                  </div>
                )}
              </figure>
            );
          })}
        </div>

        <div className="min-w-0 space-y-3">
          <h3 className="text-sm font-semibold">Findings to review ({comparison.findings.length})</h3>
          {comparison.findings.length === 0 ? (
            <p className="rounded-md border border-border p-3 text-sm leading-relaxed text-muted-foreground">
              No active visual findings were recorded in either assessment. This is not evidence that
              a previous condition was fixed; the images above are provided for your own comparison.
            </p>
          ) : (
            <ul className="max-h-[25rem] space-y-2 overflow-y-auto pr-1">
              {comparison.findings.map((finding) => {
                const itemStatus = statusPresentation[finding.status];
                const ItemIcon = itemStatus.icon;
                return (
                  <li key={finding.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFindingId(finding.id);
                        setSelectedBeforePhotoId(finding.beforeImageId ?? '');
                        setSelectedAfterPhotoId(finding.afterImageId ?? '');
                      }}
                      aria-pressed={selectedFinding?.id === finding.id}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        selectedFinding?.id === finding.id
                          ? 'border-brand/50 bg-brand/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{finding.title}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${itemStatus.tone}`}>
                          <ItemIcon className="h-3 w-3" />
                          {itemStatus.label}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {finding.detail}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {selectedFinding && (
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Earlier visual evidence
                </p>
                <p className="text-sm leading-relaxed">
                  {selectedFinding.beforeEvidence ?? 'No earlier finding was recorded with this label.'}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Follow-up visual evidence
                </p>
                <p className="text-sm leading-relaxed">
                  {selectedFinding.afterEvidence ??
                    'No matching finding was recorded in the follow-up report. This does not establish that the condition is absent.'}
                </p>
              </div>
            </div>
          )}
          {selectedFinding?.status === 'possibly_changed' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Both scans use the same guided view label. That does not guarantee the camera position or
              framing matched, so review the images before deciding whether anything changed.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
