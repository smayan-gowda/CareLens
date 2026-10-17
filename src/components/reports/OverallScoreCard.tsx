import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { ScanResult } from "@/types/ai";
import { projectedScore } from "./reportMath";

interface OverallScoreCardProps {
  scan: ScanResult;
  previousScore?: number;
}

const scoreColor = (score: number) => (score >= 85 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive");
const barColor = (score: number) => (score >= 85 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive");

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
  const score = scan.safetyScore;
  const ratingText = score >= 85 ? "Excellent" : score >= 60 ? "Needs attention" : "Critical";
  const potential = projectedScore(score, scan.recommendations);
  const delta = typeof previousScore === "number" ? score - previousScore : null;

  const summary =
    score >= 85
      ? "This room maintains safe clearances with no significant risks identified."
      : score >= 60
      ? "This room generally maintains safe clearances, but presents specific, manageable risks."
      : "This room presents risks that should be addressed promptly.";

  return (
    <div id="overview" className="scroll-mt-24">
      <span className="field-tag text-muted-foreground block mb-3">Safety Score</span>

      <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-center border-t border-b border-border py-10">
        {/* The instrument — a linear composition, not a stock gauge */}
        <div className="md:col-span-5">
          <div className="flex items-end gap-3">
            <AnimatedNumber value={score} className={`tabular text-7xl md:text-8xl font-semibold tracking-tighter leading-none ${scoreColor(score)}`} />
            <span className="text-muted-foreground text-lg mb-2">/ 100</span>
          </div>

          <div className="relative h-1.5 w-full bg-muted mt-6 overflow-hidden">
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
        </div>

        {/* The explanation — why this score, and how it compares */}
        <div className="md:col-span-7 md:border-l border-border md:pl-16">
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6 max-w-xl">{summary}</p>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <span className="field-tag text-muted-foreground block mb-1.5">Previous report</span>
              {delta !== null ? (
                <div className="flex items-center gap-2">
                  <span className="tabular text-2xl font-semibold">{previousScore}</span>
                  <span className={`text-sm font-medium ${delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {delta > 0 ? `+${delta}` : delta === 0 ? "No change" : delta}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">First assessment</span>
              )}
            </div>
            <div>
              <span className="field-tag text-muted-foreground block mb-1.5">If recommendations are completed</span>
              <span className="tabular text-2xl font-semibold text-success">{potential}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
