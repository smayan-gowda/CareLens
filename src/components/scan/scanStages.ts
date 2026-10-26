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
    label: "Analyzing each photo",
    detail: "Reviewing each view separately so detections remain tied to the correct image.",
  },
  {
    phase: "finalizing",
    label: "Compiling findings & next steps",
    detail: "Applying deductive scoring formula and organizing practical recommendations.",
  },
];
