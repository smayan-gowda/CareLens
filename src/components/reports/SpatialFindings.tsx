import type { BoundingBox, DetectedObject, SpatialFinding } from '@/types/ai';

interface SpatialFindingsProps {
  findings: SpatialFinding[];
  detectedObjects: DetectedObject[];
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

function isValidBox(box: BoundingBox | undefined): box is BoundingBox {
  return Boolean(
    box &&
      Number.isFinite(box.x) &&
      Number.isFinite(box.y) &&
      Number.isFinite(box.width) &&
      Number.isFinite(box.height) &&
      box.x >= 0 &&
      box.y >= 0 &&
      box.width > 0 &&
      box.height > 0 &&
      box.x + box.width <= 100 &&
      box.y + box.height <= 100
  );
}

function SpatialMap({
  findings,
  detectedObjects,
}: {
  findings: SpatialFinding[];
  detectedObjects: DetectedObject[];
}) {
  const objectsById = new Map(detectedObjects.map((object) => [object.id, object]));
  const mappedObjects = detectedObjects.filter(
    (object): object is DetectedObject & { boundingBox: BoundingBox } =>
      isValidBox(object.boundingBox)
  );

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
              const first = objectsById.get(firstId)?.boundingBox;
              const second = objectsById.get(secondId)?.boundingBox;
              if (!isValidBox(first) || !isValidBox(second)) return null;
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
          {mappedObjects.map((object, index) => {
            const box = object.boundingBox!;
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
                  left: `${object.boundingBox.x}%`,
                  top: `${object.boundingBox.y}%`,
                  width: `${object.boundingBox.width}%`,
                  height: `${object.boundingBox.height}%`,
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

export function SpatialFindings({ findings, detectedObjects }: SpatialFindingsProps) {
  return (
    <section className="space-y-4" aria-labelledby="spatial-findings-title">
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
      <SpatialMap findings={findings} detectedObjects={detectedObjects} />
      {findings.length === 0 ? (
        <div className="border-y border-border py-5 text-sm text-muted-foreground">
          No supported spatial relationships were identified from the available detected boxes.
          This does not confirm that walkways or doorways are clear; relevant objects or regions may
          not have been detected, and a 2D image cannot establish physical clearance.
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {findings.map((finding) => (
            <article key={finding.id} className="py-5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{relationLabels[finding.relationType]}</h3>
                <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[finding.evidenceStatus]}`}>
                  {finding.evidenceStatus}
                </span>
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
