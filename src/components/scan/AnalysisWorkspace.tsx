import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShieldAlert, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LensMark } from "@/components/brand/LensMark";
import { SCAN_STAGES, SCAN_STAGES_TOTAL_MS, normalizeBox, type ScanPhase } from "./scanStages";
import type { ScanResult } from "@/types/ai";

const EASE = [0.16, 1, 0.3, 1] as const;

interface AnalysisWorkspaceProps {
  previewUrl: string;
  /** Kicks off the real (mocked-backend) analysis pipeline. Called once, on mount. */
  run: () => Promise<ScanResult>;
  /** Called after the user has seen the reveal and chooses to continue. */
  onDone: (result: ScanResult) => void;
  /** Called if the real pipeline throws — parent owns the error toast / revert. */
  onError: (err: unknown) => void;
}

function useElapsed() {
  const [ms, setMs] = useState(0);
  const startRef = useRef(performance.now());
  useEffect(() => {
    const id = setInterval(() => setMs(performance.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, []);
  const totalSeconds = ms / 1000;
  return `${String(Math.floor(totalSeconds)).padStart(2, "0")}:${String(Math.floor((totalSeconds % 1) * 10))}`;
}

/** Ticking hex readout — atmosphere for the "encrypted upload" stage only. */
function CipherReadout() {
  const [hex, setHex] = useState("");
  useEffect(() => {
    const chars = "0123456789ABCDEF";
    const id = setInterval(() => {
      setHex(Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
    }, 90);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 tabular text-[11px] text-white/40">
      <Lock className="w-3 h-3" strokeWidth={2} />
      <span>AES-256 · {hex}</span>
    </div>
  );
}

/** Thin architectural grid — a constant low presence through most of processing. */
function GridOverlay({ visible }: { visible: boolean }) {
  return (
    <motion.svg
      animate={{ opacity: visible ? 0.14 : 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <pattern id="scan-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#scan-grid)" />
    </motion.svg>
  );
}

const GENERIC_BOXES = [
  { x: 8, y: 14, width: 26, height: 34, label: "Surface" },
  { x: 58, y: 10, width: 30, height: 40, label: "Fixture" },
  { x: 22, y: 56, width: 34, height: 30, label: "Furniture" },
  { x: 68, y: 58, width: 22, height: 26, label: "Opening" },
];

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

/** The per-phase visualization layered above the photograph. Each phase is
 * a distinct, purpose-built graphic — not a shared spinner reused everywhere. */
function PhaseOverlay({ phase, result }: { phase: ScanPhase; result: ScanResult | null }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="absolute inset-0"
      >
        {phase === "prepare" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <LensMark className="w-10 h-10 text-brand" />
              </motion.div>
            </motion.div>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                className={`absolute w-5 h-5 border-white/60 ${
                  i === 0 ? "top-8 left-8 border-t border-l" :
                  i === 1 ? "top-8 right-8 border-t border-r" :
                  i === 2 ? "bottom-8 left-8 border-b border-l" :
                  "bottom-8 right-8 border-b border-r"
                }`}
              />
            ))}
          </div>
        )}

        {phase === "upload" && (
          <>
            <motion.div
              animate={{ y: ["-10%", "110%"] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
              className="absolute left-0 right-0 h-px bg-brand shadow-[0_0_20px_3px_var(--brand)]"
            />
            <div className="absolute bottom-6 left-6">
              <CipherReadout />
            </div>
          </>
        )}

        {phase === "geometry" && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {[
              "M0,70 L45,42 L100,70",
              "M0,90 L45,42 L100,90",
              "M45,42 L45,100",
            ].map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="0.3"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 0.9, delay: i * 0.15, ease: EASE }}
              />
            ))}
            <motion.circle
              cx="45" cy="42" r="0.8" fill="var(--brand)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            />
          </svg>
        )}

        {phase === "objects" && (
          <div className="absolute inset-0 text-white/30">
            {(() => {
              const objects = (result?.detectedObjects || [])
                .filter((o) => o.boundingBox)
                .slice(0, 4)
                .map((o) => ({ ...normalizeBox(o.boundingBox!), label: o.name }));
              const displayBoxes = objects.length > 0 ? objects : GENERIC_BOXES;
              return displayBoxes.map((b, i) => (
                <motion.div
                  key={b.label + "-" + i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.18, duration: 0.5, ease: EASE }}
                  className="absolute border border-brand/70"
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.18 + 0.2, duration: 0.4 }}
                    className="absolute -top-6 left-0 tabular text-[10px] text-brand bg-black/70 px-1.5 py-0.5 whitespace-nowrap"
                  >
                    {b.label}
                  </motion.span>
                </motion.div>
              ));
            })()}
          </div>
        )}

        {phase === "paths" && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <motion.path
              d="M15,92 C 35,80 30,60 50,55 C 68,50 70,35 85,20"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: EASE }}
            />
            {[{ x: 15, y: 92 }, { x: 85, y: 20 }].map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x} cy={p.y} r="1.2" fill="var(--brand)"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ delay: i === 0 ? 0.1 : 1.3, duration: 0.5 }}
              />
            ))}
          </svg>
        )}

        {phase === "hazards" && (
          <div className="absolute inset-0 text-white/30">
            {(() => {
              const hazardsWithBoxes = (result?.hazards || [])
                .map((h) => {
                  const resolvedBox = resolveHazardBox(h, result?.detectedObjects || []);
                  return resolvedBox ? { ...normalizeBox(resolvedBox), label: h.title } : null;
                })
                .filter(Boolean)
                .slice(0, 4) as Array<{ x: number; y: number; width: number; height: number; label: string }>;
              
              if (hazardsWithBoxes.length > 0) {
                return hazardsWithBoxes.map((b, i) => {
                  const centerX = b.x + b.width / 2;
                  const centerY = b.y + b.height / 2;
                  return (
                    <div key={b.label + "-" + i} className="absolute inset-0 pointer-events-none isolate overflow-hidden">
                      {/* Bounding box around the hazard */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.15, duration: 0.5, ease: EASE }}
                        className="absolute border border-destructive z-10"
                        style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                      >
                        <span className={`absolute ${b.y < 8 ? "top-1 left-1" : "-top-6 left-0"} tabular text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 whitespace-nowrap z-20`}>
                          {b.label}
                        </span>
                      </motion.div>

                      {/* Pulsing indicator in the center of the bounding box */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.15 + 0.2, duration: 0.5, ease: EASE }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${centerX}%`, top: `${centerY}%` }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: i * 0.4 }}
                          className="absolute inset-0 w-10 h-10 -m-5 rounded-full bg-destructive/40"
                        />
                        <div className="w-10 h-10 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-destructive" strokeWidth={2} />
                        </div>
                      </motion.div>
                    </div>
                  );
                });
              } else {
                const fallbackPoints = (result?.detectedObjects || [])
                  .filter((o) => o.boundingBox)
                  .slice(0, 3)
                  .map((o) => {
                    const nb = normalizeBox(o.boundingBox!);
                    return { x: nb.x + nb.width / 2, y: nb.y + nb.height / 2 };
                  });

                const pointsToRender = fallbackPoints.length > 0 ? fallbackPoints : [{ x: 28, y: 66 }, { x: 72, y: 40 }];

                return pointsToRender.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.35, duration: 0.5, ease: EASE }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: i * 0.4 }}
                      className="absolute inset-0 w-10 h-10 -m-5 rounded-full bg-destructive/40"
                    />
                    <div className="w-10 h-10 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-destructive" strokeWidth={2} />
                    </div>
                  </motion.div>
                ));
              }
            })()}
          </div>
        )}

        {phase === "risk" && (
          <motion.div
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 40% 30% at 30% 75%, color-mix(in oklch, var(--warning), transparent 45%), transparent 70%), radial-gradient(ellipse 30% 25% at 70% 45%, color-mix(in oklch, var(--destructive), transparent 55%), transparent 70%)",
            }}
          />
        )}

        {phase === "score" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="3" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: [2 * Math.PI * 42, 2 * Math.PI * 42 * 0.25, 2 * Math.PI * 42 * 0.6] }}
                transition={{ duration: 1.6, ease: EASE, times: [0, 0.6, 1] }}
              />
            </svg>
          </div>
        )}

        {phase === "recommendations" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.22, duration: 0.5, ease: EASE }}
                className="flex items-center gap-2.5 bg-black/50 backdrop-blur-sm px-3.5 py-2 border border-white/10"
              >
                <Check className="w-3 h-3 text-brand shrink-0" strokeWidth={2.5} />
                <span className="w-32 h-1.5 bg-white/20" />
              </motion.div>
            ))}
          </div>
        )}

        {phase === "finalize" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="w-14 h-14 border border-brand/60 flex items-center justify-center bg-black/40"
            >
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                <Check className="w-6 h-6 text-brand" strokeWidth={2} />
              </motion.div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** Right-hand (desktop) / bottom (mobile) system log — replaces a percentage bar. */
function StageLog({ activeIndex, elapsed }: { activeIndex: number; elapsed: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <LensMark className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold tracking-wide text-white">CARELENS VISION</span>
        </div>
        <span className="tabular text-xs text-white/40">{elapsed}</span>
      </div>

      <div className="flex-1 space-y-0">
        {SCAN_STAGES.map((stage, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <div key={stage.label} className="py-3 border-b border-white/[0.07] last:border-b-0">
              <div className="flex items-center gap-3">
                <span
                  className={`shrink-0 w-4 h-4 flex items-center justify-center border transition-colors duration-300 ${
                    state === "done" ? "bg-brand border-brand" : state === "active" ? "border-brand" : "border-white/20"
                  }`}
                >
                  {state === "done" && <Check className="w-2.5 h-2.5 text-brand-foreground" strokeWidth={3} />}
                  {state === "active" && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-1.5 h-1.5 bg-brand"
                    />
                  )}
                </span>
                <span
                  className={`text-[13px] font-medium tracking-tight transition-colors duration-300 ${
                    state === "pending" ? "text-white/30" : "text-white"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              <AnimatePresence>
                {state === "active" && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-white/45 mt-1.5 ml-7 leading-relaxed"
                  >
                    {stage.detail}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The data-driven finale: real bounding boxes, real score, real hazards. */
function RevealPanel({ result, previewUrl, onContinue }: { result: ScanResult; previewUrl: string; onContinue: () => void }) {
  const [displayScore, setDisplayScore] = useState(0);
  const boxes = useMemo(() => {
    const hazardBoxes = result.hazards
      .map((h) => {
        const resolvedBox = resolveHazardBox(h, result.detectedObjects || []);
        return resolvedBox ? { ...normalizeBox(resolvedBox), label: h.title, tone: "hazard" as const } : null;
      })
      .filter(Boolean)
      .slice(0, 4) as Array<{ x: number; y: number; width: number; height: number; label: string; tone: "hazard" | "object" }>;

    if (hazardBoxes.length > 0) return hazardBoxes;
    return (result.detectedObjects || [])
      .filter((o) => o.boundingBox)
      .slice(0, 3)
      .map((o) => ({ ...normalizeBox(o.boundingBox!), label: o.name, tone: "object" as const }));
  }, [result]);

  useEffect(() => {
    const target = result.safetyScore;
    const start = performance.now();
    const duration = 1100;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplayScore(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result.safetyScore]);

  const scoreColor = result.safetyScore >= 90 ? "text-success" : result.safetyScore >= 70 ? "text-warning" : "text-destructive";
  const topHazards = result.hazards.slice(0, 4);

  const narrative =
    result.hazards.length === 0
      ? "This room is in good shape."
      : topHazards.filter((h) => h.severity === "Critical" || h.severity === "High").length === 0
      ? "A few small things worth a look."
      : "Found some things worth addressing.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="grid md:grid-cols-12 gap-8 md:gap-14 items-start"
    >
      <div className="md:col-span-7 flex justify-center items-center">
        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-border max-w-full bg-black">
          <img 
            src={previewUrl} 
            className="max-w-full max-h-[60vh] md:max-h-[75vh] w-auto h-auto block object-contain opacity-90" 
            alt="Analyzed room" 
          />
          <div className="absolute inset-0 pointer-events-none isolate overflow-hidden">
            {boxes.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5, ease: EASE }}
                className={`absolute border-2 ${b.tone === "hazard" ? "border-destructive animate-pulse z-20" : "border-sky-400/80 z-10"}`}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
              >
                <span
                  className={`absolute ${b.y < 8 ? "top-1 left-1" : "-top-6 left-0"} tabular text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap shadow-md z-30 ${
                    b.tone === "hazard" ? "bg-destructive text-destructive-foreground animate-none" : "bg-sky-500 text-white"
                  }`}
                >
                  {b.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-5">
        <span className="field-tag text-muted-foreground block mb-3">Analysis complete</span>
        <h2 className="narrative text-3xl md:text-4xl mb-6 text-balance">{narrative}</h2>

        <div className="flex items-end gap-3 mb-8 pb-8 border-b border-border">
          <span className={`tabular text-6xl font-semibold tracking-tight ${scoreColor}`}>{displayScore}</span>
          <span className="text-muted-foreground text-sm mb-2">/ 100 safety score</span>
        </div>

        {topHazards.length > 0 && (
          <div className="space-y-0 mb-8">
            {topHazards.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.4, ease: EASE }}
                className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-b-0"
              >
                <span className="text-sm font-medium truncate">{h.title}</span>
                <span className={`field-tag shrink-0 ${h.severity === "Critical" || h.severity === "High" ? "text-destructive" : "text-warning"}`}>
                  {h.severity}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }}>
          <Button variant="brand" size="lg" className="w-full" onClick={onContinue}>
            View Full Report <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function AnalysisWorkspace({ previewUrl, run, onDone, onError }: AnalysisWorkspaceProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [scriptDone, setScriptDone] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const errored = useRef(false);
  const elapsed = useElapsed();

  // Run the real (mocked) pipeline exactly once.
  useEffect(() => {
    run()
      .then((r) => setResult(r))
      .catch((err) => {
        if (!errored.current) {
          errored.current = true;
          onError(err);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advance the scripted narration on its own clock, independent of the
  // real promise, so the experience never feels rushed — and never stalls
  // if the mock resolves in a few hundred milliseconds.
  useEffect(() => {
    if (scriptDone) return;

    const currentStage = SCAN_STAGES[stageIndex];
    
    // Hold at "objects" phase if result is not yet available, ensuring we always 
    // have the actual, real hazard and object coordinates to highlight during 
    // those active scanning phases.
    if (currentStage.phase === "objects" && result === null) {
      return;
    }

    const timer = setTimeout(() => {
      if (stageIndex >= SCAN_STAGES.length - 1) {
        setScriptDone(true);
      } else {
        setStageIndex((prev) => prev + 1);
      }
    }, currentStage.durationMs);

    return () => clearTimeout(timer);
  }, [stageIndex, result, scriptDone]);

  const revealed = scriptDone && result !== null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="processing"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="min-h-[100svh] flex flex-col md:flex-row"
          >
            {/* Image stage */}
            <div className="relative flex-1 md:h-screen overflow-hidden bg-neutral-900 min-h-[46vh] flex items-center justify-center p-4 md:p-8">
              {/* Blur background to maintain immersive full-bleed space fill */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-20 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${previewUrl})` }}
              />
              
              {/* Perfectly shrink-wrapped container matching the image dimensions exactly */}
              <div className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-white/10">
                <motion.img
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.05 }}
                  transition={{ duration: SCAN_STAGES_TOTAL_MS / 1000, ease: "linear" }}
                  src={previewUrl}
                  alt=""
                  className="max-w-full max-h-[70vh] md:max-h-[82vh] w-auto h-auto block object-contain opacity-85 animate-none"
                />
                <div className="absolute inset-0 bg-black/25" />
                <GridOverlay visible={true} />
                <PhaseOverlay phase={SCAN_STAGES[stageIndex].phase} result={result} />
              </div>
            </div>

            {/* Stage log */}
            <div className="md:w-[380px] shrink-0 bg-neutral-950 md:border-l border-white/10 px-6 md:px-8 py-8 md:py-10">
              <StageLog activeIndex={stageIndex} elapsed={elapsed} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="min-h-[100svh] bg-background px-6 md:px-10 py-16 md:py-20 flex items-center"
          >
            <div className="max-w-5xl mx-auto w-full">
              <RevealPanel result={result!} previewUrl={previewUrl} onContinue={() => onDone(result!)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
