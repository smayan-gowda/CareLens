// The scripted narration for the CareLens Vision analysis experience.
// This is deliberately decoupled from the real analysisService promise —
// see AnalysisWorkspace.tsx for how the two are reconciled. Durations are
// tuned so the full sequence reads as considered, not rushed and not slow.

export type ScanPhase =
  | "prepare"
  | "upload"
  | "geometry"
  | "objects"
  | "paths"
  | "hazards"
  | "risk"
  | "score"
  | "recommendations"
  | "finalize";

export interface ScanStage {
  phase: ScanPhase;
  label: string;
  detail: string;
  durationMs: number;
}

export const SCAN_STAGES: ScanStage[] = [
  {
    phase: "prepare",
    label: "Preparing analysis",
    detail: "Setting up a clean workspace for this image.",
    durationMs: 700,
  },
  {
    phase: "upload",
    label: "Uploading encrypted image",
    detail: "Sending your photo over an encrypted connection.",
    durationMs: 950,
  },
  {
    phase: "geometry",
    label: "Understanding room geometry",
    detail: "Establishing scale, walls, and floor boundaries.",
    durationMs: 1150,
  },
  {
    phase: "objects",
    label: "Detecting objects & furniture",
    detail: "Identifying furniture, fixtures, and objects in the frame.",
    durationMs: 1300,
  },
  {
    phase: "paths",
    label: "Mapping navigation paths",
    detail: "Tracing the natural walking paths through the room.",
    durationMs: 1050,
  },
  {
    phase: "hazards",
    label: "Identifying accessibility hazards",
    detail: "Looking for obstacles along those walking paths.",
    durationMs: 1100,
  },
  {
    phase: "risk",
    label: "Evaluating fall risks",
    detail: "Weighing footing, clearance, and lighting together.",
    durationMs: 1000,
  },
  {
    phase: "score",
    label: "Generating safety score",
    detail: "Turning those findings into a single, honest read.",
    durationMs: 900,
  },
  {
    phase: "recommendations",
    label: "Producing recommendations",
    detail: "Narrowing down to the changes that matter most.",
    durationMs: 900,
  },
  {
    phase: "finalize",
    label: "Finalizing report",
    detail: "Putting it all together.",
    durationMs: 700,
  },
];

export const SCAN_STAGES_TOTAL_MS = SCAN_STAGES.reduce((sum, s) => sum + s.durationMs, 0);

/** Normalizes a hazard/object bounding box to 0-100 percentage coordinates,
 * regardless of whether the source data used a 0-1 or 0-1000 scale. Shared
 * by every overlay that draws boxes on top of a photo. */
export function normalizeBox(box: { x: number; y: number; width: number; height: number }) {
  if (box.x <= 1 && box.y <= 1 && box.width <= 1 && box.height <= 1 && box.width > 0) {
    return { x: box.x * 100, y: box.y * 100, width: box.width * 100, height: box.height * 100 };
  }
  if (box.x > 100 || box.y > 100 || box.width > 100 || box.height > 100) {
    return { x: box.x / 10, y: box.y / 10, width: box.width / 10, height: box.height / 10 };
  }
  return box;
}
