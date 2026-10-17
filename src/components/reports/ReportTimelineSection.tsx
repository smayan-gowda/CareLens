import { motion } from "motion/react";
import { Link } from "react-router-dom";
import type { ScanResult } from "@/types/ai";
import { projectedScore } from "./reportMath";

interface ReportTimelineSectionProps {
  currentScan: ScanResult;
  roomScans: ScanResult[];
  homeId: string;
  roomId: string;
}

const scoreColor = (score: number) => (score >= 85 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive");
const dotColor = (score: number) => (score >= 85 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive");

export function ReportTimelineSection({ currentScan, roomScans, homeId, roomId }: ReportTimelineSectionProps) {
  const history = roomScans
    .filter((s) => s.status === "Completed")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const potential = projectedScore(currentScan.safetyScore, currentScan.recommendations);
  const completedRecs = (currentScan.recommendations || []).filter((r) => !!r.completedAt);
  const pendingRecs = (currentScan.recommendations || []).filter((r) => !r.completedAt);

  const scores = [...history.map((s) => s.safetyScore), potential];
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = Math.max(1, max - min);

  const points = history.map((s) => ({
    id: s.id,
    date: s.createdAt,
    score: s.safetyScore,
    isCurrent: s.id === currentScan.id,
  }));

  const hasProjection = potential > currentScan.safetyScore;
  const totalSlots = Math.max(1, points.length + (hasProjection ? 1 : 0) - 1);

  const getX = (index: number) => {
    if (points.length === 1 && !hasProjection) return 50;
    return (index / totalSlots) * 100;
  };

  const getY = (score: number) => {
    return 100 - ((score - min) / range) * 100;
  };

  return (
    <div id="timeline" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-3">
        <span className="field-tag text-muted-foreground">Timeline & Trajectory</span>
        {hasProjection && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-success/15 text-success font-medium">
            +{potential - currentScan.safetyScore} pts projected
          </span>
        )}
      </div>
      <p className="text-muted-foreground mb-8 max-w-lg">
        {history.length > 1
          ? "Safety score progression across assessments and completed improvements."
          : "Initial assessment score and projected room trajectory upon completing recommendations."}
      </p>

      {points.length > 0 && (
        <div className="relative pt-4 pb-12 border-b border-border overflow-x-auto">
          <div className="relative h-44 min-w-[480px] px-2">
            {/* Baseline */}
            <div className="absolute left-0 right-0 bottom-0 h-px bg-border" />

            {/* Progression line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="2.5"
                points={points.map((p, i) => `${getX(i)}%,${getY(p.score)}%`).join(" ")}
              />
              {hasProjection && (
                <motion.line
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  x1={`${getX(points.length - 1)}%`}
                  y1={`${getY(currentScan.safetyScore)}%`}
                  x2="100%"
                  y2={`${getY(potential)}%`}
                  stroke="var(--success)"
                  strokeOpacity={0.8}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}
            </svg>

            {/* Points */}
            {points.map((p, i) => {
              const x = getX(i);
              const y = getY(p.score);
              return (
                <Link
                  key={p.id}
                  to={`/properties/${homeId}/rooms/${roomId}/assessments/${p.id}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 400, damping: 20 }}
                    className={`block w-3.5 h-3.5 rounded-full ${dotColor(p.score)} ${p.isCurrent ? "ring-4 ring-brand/20 shadow-md" : ""} group-hover:scale-125 transition-transform`}
                  />
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className="tabular text-xs font-semibold block">{p.score}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                </Link>
              );
            })}

            {hasProjection && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: "100%", top: `${getY(potential)}%` }}
              >
                <span className="block w-3.5 h-3.5 rounded-full border-2 border-dashed border-success bg-background shadow-sm" />
                <div className="absolute top-5 right-0 whitespace-nowrap text-right">
                  <span className="tabular text-xs font-semibold text-success block">{potential}</span>
                  <span className="text-[10px] text-success font-medium">Projected Target</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report list */}
      <div className="border-t border-border">
        {[...history].reverse().map((s) => (
          <Link
            key={s.id}
            to={`/properties/${homeId}/rooms/${roomId}/assessments/${s.id}`}
            className={`flex items-center justify-between py-4 border-b border-border transition-colors ${
              s.id === currentScan.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="tabular text-xs w-20 shrink-0">
                {new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-sm">
                {s.id === currentScan.id ? "Current Assessment" : "Historical Assessment"}
              </span>
            </div>
            <span className={`tabular text-sm font-semibold ${scoreColor(s.safetyScore)}`}>{s.safetyScore}</span>
          </Link>
        ))}

        {completedRecs.map((rec) => (
          <div key={rec.id} className="flex items-center justify-between py-3.5 border-b border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>Resolved: {rec.title}</span>
            </div>
            <span className="tabular font-medium text-success">+{rec.expectedImpact} pts</span>
          </div>
        ))}

        <div className="flex items-center justify-between py-4 text-muted-foreground">
          <span className="text-sm">
            {pendingRecs.length > 0 ? `Projected score (${pendingRecs.length} open recommendations)` : "Fully Optimized Score"}
          </span>
          <span className="tabular text-sm font-semibold text-success">{potential}</span>
        </div>
      </div>
    </div>
  );
}
