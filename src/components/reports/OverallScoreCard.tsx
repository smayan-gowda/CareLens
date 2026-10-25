import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ScanResult } from "@/types/ai";
import { projectedScore, getScoreFormulaBreakdown } from "./reportMath";
import { Info, Calculator, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverallScoreCardProps {
  scan: ScanResult;
  previousScore?: number;
}

const scoreColor = (score: number) =>
  score >= 85 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
const barColor = (score: number) =>
  score >= 85 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive";

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{display}</span>;
}

export function OverallScoreCard({ scan, previousScore }: OverallScoreCardProps) {
  const [showFormula, setShowFormula] = useState(false);

  const breakdown = useMemo(() => {
    return getScoreFormulaBreakdown(scan.hazards || []);
  }, [scan.hazards]);

  // Use the calculated deterministic score if hazards are present, or the scan's recorded score
  const score = scan.hazards && scan.hazards.length > 0 ? breakdown.calculatedScore : scan.safetyScore;
  const ratingText = score >= 85 ? "Good Baseline" : score >= 60 ? "Needs Attention" : "Urgent Hazards Flagged";
  const potential = projectedScore(score, scan.recommendations || []);
  const delta = typeof previousScore === "number" ? score - previousScore : null;

  const summary =
    score >= 85
      ? "This room displays adequate visible clearances and lighting. Low deduction count indicates fewer visible obstacles in photo."
      : score >= 60
      ? "This room generally maintains safe general space, but specific visible hazards reduce balance confidence."
      : "Multiple visible obstacles or missing safety supports require prompt on-site inspection and remediation.";

  return (
    <div id="overview" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between">
        <span className="field-tag text-muted-foreground block">Preliminary Safety Index</span>
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showFormula ? "Hide Formula" : "How this score is calculated"}</span>
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start border-t border-b border-border py-10">
        {/* The instrument */}
        <div className="md:col-span-5">
          <div className="flex items-end gap-3">
            <AnimatedNumber
              value={score}
              className={`tabular text-7xl md:text-8xl font-semibold tracking-tighter leading-none ${scoreColor(score)}`}
            />
            <span className="text-muted-foreground text-lg mb-2">/ 100</span>
          </div>

          <div className="relative h-2 w-full bg-muted mt-6 overflow-hidden rounded-full">
            <motion.div
              className={`absolute inset-y-0 left-0 ${barColor(score)}`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
            {potential > score && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${potential}%` }}
                transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 border-r-2 border-dashed border-foreground/40"
              />
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <h3 className={`text-xl font-semibold tracking-tight ${scoreColor(score)}`}>{ratingText}</h3>
            {potential > score && (
              <span className="text-xs text-muted-foreground">
                Up to <span className="tabular font-medium text-foreground">{potential}</span> possible
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Active hazards detected:</span>
              <span className="tabular font-semibold text-foreground">
                {(scan.hazards || []).filter((h) => h.feedback !== "not_present").length}
              </span>
            </div>
            {breakdown.reviewedNotPresentCount > 0 && (
              <div className="flex justify-between text-success">
                <span>Items verified 'Not Present':</span>
                <span className="tabular font-semibold">+{breakdown.refundedPoints} pts restored</span>
              </div>
            )}
          </div>
        </div>

        {/* The explanation */}
        <div className="md:col-span-7 md:border-l border-border md:pl-16 space-y-6">
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">{summary}</p>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <span className="field-tag text-muted-foreground block mb-1.5">Previous scan comparison</span>
              {delta !== null ? (
                <div className="flex items-center gap-2">
                  <span className="tabular text-2xl font-semibold">{previousScore}</span>
                  <span
                    className={`text-sm font-medium ${
                      delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta === 0 ? "No change" : delta}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Baseline assessment</span>
              )}
            </div>
            <div>
              <span className="field-tag text-muted-foreground block mb-1.5">Projected after fixes</span>
              <span className="tabular text-2xl font-semibold text-success">{potential} / 100</span>
            </div>
          </div>

          {/* Absence of hazard disclaimer */}
          <div className="p-3.5 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-foreground font-medium">Important Safety Context:</strong> This score is a
              preliminary visual index based on objects identified in submitted photos. A high score does not
              guarantee the room is completely free of slip hazards, loose handrails, or non-visible electrical/structural risks.
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Mathematical Formula Breakdown */}
      <AnimatePresence>
        {showFormula && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-card border border-border rounded-xl space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-brand" />
                  <h4 className="font-semibold text-foreground">Deductive Scoring Formula Breakdown</h4>
                </div>
                <span className="text-xs text-muted-foreground font-mono">100 - Total Deductions = Score</span>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground">Critical Hazards (-15 ea)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="tabular font-medium text-foreground">{breakdown.criticalCount} detected</span>
                    <span className="tabular font-semibold text-destructive">-{breakdown.criticalDeduction}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground">High Concerns (-10 ea)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="tabular font-medium text-foreground">{breakdown.highCount} detected</span>
                    <span className="tabular font-semibold text-warning">-{breakdown.highDeduction}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground">Medium Attention (-5 ea)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="tabular font-medium text-foreground">{breakdown.mediumCount} detected</span>
                    <span className="tabular font-semibold text-warning">-{breakdown.mediumDeduction}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground">Low / Minor Notes (-2 ea)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="tabular font-medium text-foreground">{breakdown.lowCount} detected</span>
                    <span className="tabular font-semibold text-muted-foreground">-{breakdown.lowDeduction}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground gap-2">
                <div>
                  Starting Baseline: <span className="tabular font-semibold text-foreground">100</span>
                  {" - "}
                  Total Deductions: <span className="tabular font-semibold text-destructive">-{breakdown.totalDeductions}</span>
                  {" = "}
                  Current Score: <span className="tabular font-semibold text-foreground">{score}</span>
                </div>
                <div className="text-[11px] text-muted-foreground italic">
                  Marking a finding "Not Present" automatically restores deducted points in the report.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
