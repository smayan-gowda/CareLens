import type { SpatialFinding } from '@/types/ai';

interface SpatialFindingsProps {
  findings: SpatialFinding[];
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

export function SpatialFindings({ findings }: SpatialFindingsProps) {
  if (findings.length === 0) return null;

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
    </section>
  );
}
