import type { DetectedObject, EvidenceReview, ScanPhoto, SpatialFinding } from '@/types/ai';
import type { SpatialFindingReviewStatus } from '@/types/ai';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Eye, XCircle } from 'lucide-react';
import { normalizeBoundingBox } from '@/utils/spatialGeometry';

interface SpatialFindingsProps {
  findings: SpatialFinding[];
  detectedObjects: DetectedObject[];
  evidenceReviews: EvidenceReview[];
  photos: Array<ScanPhoto & { image: string }>;
  selectedPhotoId: string;
  onSelectPhoto: (id: string) => void;
  selectedFindingId: string | null;
  onSelectFinding: (id: string | null) => void;
  onReviewChange: (findingId: string, reviewStatus: Exclude<SpatialFindingReviewStatus, 'unreviewed'>) => void;
}

const statusStyles: Record<SpatialFinding['evidenceStatus'], string> = {
  Observed: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'Geometrically Supported': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'Potential Concern': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Needs Review': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  'Physically Unverified': 'bg-muted text-muted-foreground',
};

const relationLabels: Record<SpatialFinding['relationType'], string> = {
  proximity: 'Objects appear near each other in the image',
  overlap: 'Object detections overlap in the image',
  'duplicate-detection': 'Possible duplicate detections',
  'walkway-overlap': 'Object overlaps a detected walkway region',
  'doorway-proximity': 'Object is near a visible doorway',
  'obstacle-destination': 'Possible relationship between an obstacle and a visible destination',
};

function SpatialMap({
  findings,
  detectedObjects,
}: {
  findings: SpatialFinding[];
  detectedObjects: DetectedObject[];
}) {
  const boxesById = new Map(
    detectedObjects.map((object) => [object.id, normalizeBoundingBox(object.boundingBox)])
  );
  const mappedObjects = detectedObjects.flatMap((object) => {
    const box = boxesById.get(object.id);
    return box ? [{ object, box }] : [];
  });

  if (mappedObjects.length === 0) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)]">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Detected-object relationship map</span>
          <span>Image coordinates · not a floor plan</span>
        </div>
        <div
          className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/35"
          role="img"
          aria-label="Schematic map of detected image boxes and their spatial relationships"
        >
          <div className="absolute inset-0 opacity-50">
            {[25, 50, 75].map((position) => (
              <span
                key={`grid-x-${position}`}
                className="absolute inset-y-0 border-l border-border"
                style={{ left: `${position}%` }}
              />
            ))}
            {[25, 50, 75].map((position) => (
              <span
                key={`grid-y-${position}`}
                className="absolute inset-x-0 border-t border-border"
                style={{ top: `${position}%` }}
              />
            ))}
          </div>
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {findings.map((finding) => {
              const [firstId, secondId] = finding.objectIds;
              const first = boxesById.get(firstId);
              const second = boxesById.get(secondId);
              if (!first || !second) return null;
              return (
                <line
                  key={finding.id}
                  x1={first.x + first.width / 2}
                  y1={first.y + first.height / 2}
                  x2={second.x + second.width / 2}
                  y2={second.y + second.height / 2}
                  className="stroke-brand"
                  strokeWidth="0.8"
                  strokeDasharray="2 1.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {mappedObjects.map(({ object, box }, index) => {
            const hasRelation = findings.some((finding) => finding.objectIds.includes(object.id));
            return (
              <div
                key={object.id}
                title={`${object.name} — image box x ${box.x}, y ${box.y}, width ${box.width}, height ${box.height}`}
                className={`absolute overflow-hidden rounded-sm border ${
                  hasRelation
                    ? "border-brand bg-brand/15"
                    : "border-muted-foreground/45 bg-muted-foreground/5"
                }`}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                  minWidth: "3px",
                  minHeight: "3px",
                }}
              >
                <span className="block truncate bg-background/80 px-1 text-[9px] leading-4 text-foreground">
                  {index + 1}. {object.name}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-brand bg-brand/15" />
            In a reported relationship
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-muted-foreground/45" />
            Other detected object
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-brand" />
            Reported relationship
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-medium text-foreground">What the map represents</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Outlines show the vision model&apos;s detected bounding boxes in the photo&apos;s normalized
          0–100 coordinate space. Dashed lines connect the object pairs listed below. The square
          schematic is not the room&apos;s floor plan and does not show a traversable route.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Relationships are geometric review cues—not proof of a collision, obstruction, or real-world
          clearance. Findings do not affect the safety score.
        </p>
      </div>
    </div>
  );
}

export function SpatialFindings({
  findings,
  detectedObjects,
  evidenceReviews,
  photos,
  selectedPhotoId,
  onSelectPhoto,
  selectedFindingId,
  onSelectFinding,
  onReviewChange,
}: SpatialFindingsProps) {
  const activePhotoIndex = Math.max(0, photos.findIndex((photo) => photo.id === selectedPhotoId));
  const visibleFindings = findings.filter(
    (finding) => finding.imageId === selectedPhotoId || (!finding.imageId && activePhotoIndex === 0)
  );
  const visibleObjects = detectedObjects.filter(
    (object) => object.imageId === selectedPhotoId || (!object.imageId && activePhotoIndex === 0)
  );

  return (
    <section id="spatial-findings" className="space-y-4 scroll-mt-24" aria-labelledby="spatial-findings-title">
      <div>
        <span className="field-tag text-muted-foreground block mb-1">Image-coordinate analysis</span>
        <h2 id="spatial-findings-title" className="text-2xl font-semibold tracking-tight">
          Spatial relationships for review
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          These findings compare detected image regions only. They do not establish real-world
          distances or confirm that a route is physically blocked, and they do not affect the safety score.
        </p>
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-pressed={photo.id === selectedPhotoId}
              onClick={() => onSelectPhoto(photo.id)}
              className={`w-36 shrink-0 overflow-hidden rounded-lg border text-left transition-colors ${
                photo.id === selectedPhotoId
                  ? "border-brand ring-2 ring-brand/25"
                  : "border-border hover:border-brand/50"
              }`}
            >
              <img src={photo.image} alt="" className="h-20 w-full object-cover" />
              <span className="block truncate px-2 py-1.5 text-[11px] font-medium">
                {index === 0 ? "Overview" : photo.label}
              </span>
            </button>
          ))}
        </div>
      )}
      {photos.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Map and object relationships are scoped to the selected photo:{" "}
          <span className="font-medium text-foreground">
            {photos[activePhotoIndex]?.label || "Room overview"}
          </span>
        </p>
      )}
      <SpatialMap findings={visibleFindings} detectedObjects={visibleObjects} />
      {visibleFindings.length === 0 ? (
        <div className="border-y border-border py-5 text-sm text-muted-foreground">
          No supported spatial relationships were identified in this photo.
          This does not confirm that walkways or doorways are clear; relevant objects or regions may
          not have been detected, and a 2D image cannot establish physical clearance.
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {visibleFindings.map((finding) => (
            <article
              key={finding.id}
              className={`py-5 space-y-3 transition-colors ${
                selectedFindingId === finding.id ? 'bg-brand/5 -mx-3 px-3 rounded-lg' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="font-medium text-left hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand rounded-sm"
                  aria-pressed={selectedFindingId === finding.id}
                  onClick={() => onSelectFinding(selectedFindingId === finding.id ? null : finding.id)}
                >
                  {relationLabels[finding.relationType]}
                </button>
                <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[finding.evidenceStatus]}`}>
                  {finding.evidenceStatus}
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {finding.provenance?.origin === 'spatial-engine'
                    ? 'Deterministic geometry'
                    : 'Source not recorded'}
                </span>
                {finding.reviewStatus && finding.reviewStatus !== 'unreviewed' && (
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {finding.reviewStatus === 'confirmed'
                      ? 'You confirmed this'
                      : finding.reviewStatus === 'disputed'
                        ? 'You marked this not present'
                        : 'You requested another review'}
                  </span>
                )}
              </div>
              <p className="text-sm">
                <span className="font-medium">Objects:</span> {finding.objectsInvolved.join(' and ')}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Geometric evidence:</span>{' '}
                {finding.geometricEvidence}
              </p>
              <p className="text-xs text-muted-foreground">
                Confidence: {finding.confidence}% (heuristic, not calibrated). {finding.limitations}
              </p>
              <details className="text-xs text-muted-foreground">
                <summary className="w-fit cursor-pointer font-medium text-foreground">
                  Evidence record details
                </summary>
                <div className="mt-2 space-y-1">
                  <p>Relationship record: <code>{finding.id}</code></p>
                  <p>Observation records: {finding.objectIds.map((id) => <code key={id} className="mr-2">{id}</code>)}</p>
                  {finding.provenance?.createdAt && (
                    <p>Derived by spatial engine: {new Date(finding.provenance.createdAt).toLocaleString()}</p>
                  )}
                  {evidenceReviews
                    .filter((review) => review.targetType === 'spatial-finding' && review.targetId === finding.id)
                    .map((review) => (
                      <p key={review.id}>
                        User {review.status.replaceAll('_', ' ')} · {new Date(review.reviewedAt).toLocaleString()} ·{" "}
                        <code>{review.id}</code>
                        {review.note ? ` · ${review.note}` : ''}
                      </p>
                    ))}
                  {!evidenceReviews.some(
                    (review) =>
                      review.targetType === 'spatial-finding' && review.targetId === finding.id
                  ) && <p>No user review has been recorded.</p>}
                </div>
              </details>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground font-medium">Your review:</span>
                <Button
                  size="sm"
                  variant={finding.reviewStatus === 'confirmed' ? 'secondary' : 'outline'}
                  className="h-8 gap-1.5 text-xs"
                  aria-pressed={finding.reviewStatus === 'confirmed'}
                  onClick={() => onReviewChange(finding.id, 'confirmed')}
                >
                  <Check className="h-3.5 w-3.5" />
                  Looks right
                </Button>
                <Button
                  size="sm"
                  variant={finding.reviewStatus === 'disputed' ? 'secondary' : 'outline'}
                  className="h-8 gap-1.5 text-xs"
                  aria-pressed={finding.reviewStatus === 'disputed'}
                  onClick={() => onReviewChange(finding.id, 'disputed')}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Not present
                </Button>
                <Button
                  size="sm"
                  variant={finding.reviewStatus === 'needs_review' ? 'secondary' : 'outline'}
                  className="h-8 gap-1.5 text-xs"
                  aria-pressed={finding.reviewStatus === 'needs_review'}
                  onClick={() => onReviewChange(finding.id, 'needs_review')}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Needs review
                </Button>
                {finding.objectIds.length > 0 && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    Select to highlight photo evidence
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
