export type ScanPhase = "prepare" | "analyzing" | "finalizing";

export interface ScanStage {
  phase: ScanPhase;
  label: string;
  detail: string;
}

export const SCAN_STAGES: ScanStage[] = [
  {
    phase: "prepare",
    label: "Preparing photo",
    detail: "Validating image dimensions and preparing visual analysis payload.",
  },
  {
    phase: "analyzing",
    label: "Analyzing with Gemini Vision",
    detail: "Processing room geometry, visible obstacles, and accessibility clearances.",
  },
  {
    phase: "finalizing",
    label: "Compiling findings & next steps",
    detail: "Applying deductive scoring formula and organizing practical recommendations.",
  },
];

/**
 * Normalizes a hazard/object bounding box to 0-100 percentage coordinates,
 * regardless of whether the source data used a 0-1 or 0-1000 scale.
 */
export function normalizeBox(box: { x: number; y: number; width: number; height: number }) {
  if (box.x <= 1 && box.y <= 1 && box.width <= 1 && box.height <= 1 && box.width > 0) {
    return { x: box.x * 100, y: box.y * 100, width: box.width * 100, height: box.height * 100 };
  }
  if (box.x > 100 || box.y > 100 || box.width > 100 || box.height > 100) {
    return { x: box.x / 10, y: box.y / 10, width: box.width / 10, height: box.height / 10 };
  }
  return box;
}
