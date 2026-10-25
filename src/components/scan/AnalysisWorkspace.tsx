import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShieldAlert, ArrowRight, AlertTriangle, RotateCcw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LensMark } from "@/components/brand/LensMark";
import { SCAN_STAGES, normalizeBox, type ScanPhase } from "./scanStages";
import type { ScanResult } from "@/types/ai";

const EASE = [0.16, 1, 0.3, 1] as const;

interface AnalysisWorkspaceProps {
  previewUrl: string;
  roomName?: string;
  /** Kicks off the real analysis pipeline */
  run: () => Promise<ScanResult>;
  /** Called after the user has seen the reveal and chooses to continue */
  onDone: (result: ScanResult) => void;
  /** Called if the real pipeline throws */
  onError: (err: unknown) => void;
  /** Allow user to exit back to upload screen */
  onCancel?: () => void;
}

function useElapsed() {
  const [ms, setMs] = useState(0);
  const startRef = useRef(performance.now());
  useEffect(() => {
    const id = setInterval(() => setMs(performance.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, []);
  const totalSeconds = ms / 1000;
  return `${String(Math.floor(totalSeconds)).padStart(2, "0")}:${String(
    Math.floor((totalSeconds % 1) * 10)
  )}`;
}

function resolveHazardBox(hazard: any, detectedObjects: any[] = []): any {
  if (hazard.objectsInvolved && hazard.objectsInvolved.length > 0 && detectedObjects.length > 0) {
    for (const objName of hazard.objectsInvolved) {
      const matched = detectedObjects.find(
        (o) => o.boundingBox && o.name.toLowerCase().includes(objName.toLowerCase())
      );
      if (matched) return matched.boundingBox;
    }
    for (const objName of hazard.objectsInvolved) {
      const matched = detectedObjects.find(
        (o) =>
          o.boundingBox &&
          (o.name.toLowerCase().includes(objName.toLowerCase()) ||
            objName.toLowerCase().includes(o.name.toLowerCase()))
      );
      if (matched) return matched.boundingBox;
    }
  }

  if (hazard.boundingBox) {
    return hazard.boundingBox;
  }

  if (detectedObjects.length > 0) {
    const textToSearch = `${hazard.title} ${hazard.description}`.toLowerCase();
    const matched = detectedObjects.find(
      (o) => o.boundingBox && textToSearch.includes(o.name.toLowerCase())
    );
    if (matched) return matched.boundingBox;
  }

  return null;
}

/** The data-driven finale: real bounding boxes, real score, real hazards. */
function RevealPanel({
  result,
  previewUrl,
  onContinue,
}: {
  result: ScanResult;
  previewUrl: string;
  onContinue: () => void;
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const boxes = useMemo(() => {
    const hazardBoxes = result.hazards
      .map((h) => {
        const resolvedBox = resolveHazardBox(h, result.detectedObjects || []);
        return resolvedBox ? { ...normalizeBox(resolvedBox), label: h.title, tone: "hazard" as const } : null;
      })
      .filter(Boolean)
      .slice(0, 4) as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      tone: "hazard" | "object";
    }>;

    if (hazardBoxes.length > 0) return hazardBoxes;
    return (result.detectedObjects || [])
      .filter((o) => o.boundingBox)
      .slice(0, 3)
      .map((o) => ({ ...normalizeBox(o.boundingBox!), label: o.name, tone: "object" as const }));
  }, [result]);

  useEffect(() => {
    const target = result.safetyScore;
    const start = performance.now();
    const duration = 1000;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplayScore(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result.safetyScore]);

  const scoreColor =
    result.safetyScore >= 85
      ? "text-success"
      : result.safetyScore >= 60
      ? "text-warning"
      : "text-destructive";
  const topHazards = result.hazards.slice(0, 4);

  const narrative =
    result.hazards.length === 0
      ? "No obvious hazards detected in this view."
      : topHazards.filter((h) => h.severity === "Critical" || h.severity === "High").length === 0
      ? "Minor items identified for attention."
      : "Safety concerns identified for review.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="grid md:grid-cols-12 gap-8 md:gap-14 items-start"
    >
      <div className="md:col-span-7 flex justify-center items-center">
        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-border max-w-full bg-black">
          <img
            src={previewUrl}
            className="max-w-full max-h-[60vh] md:max-h-[75vh] w-auto h-auto block object-contain opacity-95"
            alt="Analyzed room with overlay"
          />
          <div className="absolute inset-0 pointer-events-none isolate overflow-hidden">
            {boxes.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.4, ease: EASE }}
                className={`absolute border-2 ${
                  b.tone === "hazard" ? "border-destructive z-20" : "border-sky-400/80 z-10"
                }`}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
              >
                <span
                  className={`absolute ${
                    b.y < 8 ? "top-1 left-1" : "-top-6 left-0"
                  } tabular text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap shadow-md z-30 ${
                    b.tone === "hazard"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-sky-500 text-white"
                  }`}
                >
                  {b.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-5 space-y-6">
        <div>
          <span className="field-tag text-muted-foreground block mb-2">Analysis Complete</span>
          <h2 className="narrative text-3xl md:text-4xl text-balance">{narrative}</h2>
        </div>

        <div className="flex items-end gap-3 pb-6 border-b border-border">
          <span className={`tabular text-6xl font-semibold tracking-tight ${scoreColor}`}>
            {displayScore}
          </span>
          <span className="text-muted-foreground text-sm mb-2">/ 100 preliminary score</span>
        </div>

        {topHazards.length > 0 ? (
          <div className="space-y-0">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-2">
              Primary Identified Items:
            </span>
            {topHazards.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.3, ease: EASE }}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-b-0 text-xs md:text-sm"
              >
                <span className="font-medium truncate">{h.title}</span>
                <span
                  className={`field-tag shrink-0 ${
                    h.severity === "Critical" || h.severity === "High"
                      ? "text-destructive"
                      : "text-warning"
                  }`}
                >
                  {h.severity}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            No active hazards were identified in this room angle.
          </p>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.4 }}>
          <Button variant="brand" size="lg" className="w-full cursor-pointer" onClick={onContinue}>
            Review Detailed Assessment Report <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function AnalysisWorkspace({
  previewUrl,
  roomName,
  run,
  onDone,
  onError,
  onCancel,
}: AnalysisWorkspaceProps) {
  const [phase, setPhase] = useState<ScanPhase>("prepare");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const elapsed = useElapsed();

  const executePipeline = () => {
    setErrorMessage(null);
    setPhase("prepare");

    // Phase 1: Prepare payload (quick client-side check)
    const prepTimer = setTimeout(() => {
      setPhase("analyzing");

      // Set safety timeout (5 minutes)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Analysis request timed out after 5 minutes. The vision service might be experiencing high load or your network connection is slow."
              )
            ),
          300000
        )
      );

      Promise.race([run(), timeoutPromise])
        .then((res) => {
          setPhase("finalizing");
          setTimeout(() => {
            setResult(res);
          }, 600);
        })
        .catch((err: any) => {
          const msg =
            err?.message ||
            "Unable to complete room visual analysis. Please ensure your device has internet access and try again.";
          setErrorMessage(msg);
          onError(err);
        });
    }, 800);

    return () => clearTimeout(prepTimer);
  };

  useEffect(() => {
    const cleanup = executePipeline();
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRetrying]);

  const activeStageIndex =
    phase === "prepare" ? 0 : phase === "analyzing" ? 1 : 2;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto">
      <AnimatePresence mode="wait">
        {errorMessage ? (
          /* Honest Error Screen with image preserved and retry option */
          <motion.div
            key="error-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[100svh] flex items-center justify-center p-6 md:p-12"
          >
            <div className="max-w-xl w-full bg-neutral-900 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 text-white">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Visual Analysis Did Not Complete</h3>
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black/50">
                <img
                  src={previewUrl}
                  alt="Selected room photo"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              <div className="space-y-2 text-sm text-neutral-300">
                <p className="font-medium text-white">What happened:</p>
                <p className="text-xs leading-relaxed text-neutral-400 bg-black/40 p-3 rounded border border-white/5 font-mono">
                  {errorMessage}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed pt-1">
                  Your selected room photo has been preserved safely. You can retry the assessment, or return to select another photo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="brand"
                  className="flex-1 gap-2 cursor-pointer"
                  onClick={() => setIsRetrying((prev) => !prev)}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Room Assessment</span>
                </Button>
                {onCancel && (
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
                    onClick={onCancel}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    <span>Return to Upload</span>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : !result ? (
          /* Honest In-Progress Screen */
          <motion.div
            key="processing"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="min-h-[100svh] flex flex-col md:flex-row"
          >
            {/* Image viewport */}
            <div className="relative flex-1 md:h-screen overflow-hidden bg-neutral-900 min-h-[46vh] flex items-center justify-center p-4 md:p-8">
              <div className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-white/10">
                <img
                  src={previewUrl}
                  alt="Room being analyzed"
                  className="max-w-full max-h-[70vh] md:max-h-[82vh] w-auto h-auto block object-contain opacity-90"
                />
                <div className="absolute inset-0 bg-black/20" />

                {/* Subtle center processing status */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="bg-black/70 backdrop-blur-md px-5 py-3 rounded-full border border-white/15 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                    <span className="text-xs font-medium text-white tracking-wide">
                      {SCAN_STAGES[activeStageIndex].label}...
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage progress panel */}
            <div className="md:w-[380px] shrink-0 bg-neutral-950 md:border-l border-white/10 px-6 md:px-8 py-8 md:py-10 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LensMark className="w-4 h-4 text-brand" />
                    <span className="text-xs font-semibold tracking-wide text-white">
                      CARELENS VISION
                    </span>
                  </div>
                  <span className="tabular text-xs text-white/40 font-mono">{elapsed}</span>
                </div>

                {roomName && (
                  <div className="text-xs text-neutral-400">
                    Assessing: <span className="text-white font-medium">{roomName}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {SCAN_STAGES.map((stage, i) => {
                    const isDone = i < activeStageIndex;
                    const isActive = i === activeStageIndex;
                    return (
                      <div
                        key={stage.label}
                        className={`p-3.5 rounded-xl border transition-colors ${
                          isActive
                            ? "bg-white/5 border-brand/50 text-white"
                            : isDone
                            ? "border-white/10 text-neutral-300"
                            : "border-transparent text-neutral-500"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isDone
                                ? "bg-brand text-brand-foreground"
                                : isActive
                                ? "border-2 border-brand text-brand animate-pulse"
                                : "border border-white/20 text-white/30"
                            }`}
                          >
                            {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
                          </span>
                          <span className="text-xs font-semibold">{stage.label}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1.5 ml-8 leading-relaxed">
                          {stage.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {onCancel && (
                <div className="pt-6 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer"
                    onClick={onCancel}
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel Assessment
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Reveal Screen */
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="min-h-[100svh] bg-background px-6 md:px-10 py-16 md:py-20 flex items-center"
          >
            <div className="max-w-5xl mx-auto w-full">
              <RevealPanel
                result={result}
                previewUrl={previewUrl}
                onContinue={() => onDone(result)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
