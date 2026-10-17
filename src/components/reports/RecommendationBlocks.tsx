import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, HelpCircle, ArrowRight, Wrench, Clock, DollarSign, Target, Check } from "lucide-react";
import { toast } from "sonner";
import type { Recommendation } from "@/types/ai";
import { estimatedTimeLabel } from "./reportMath";
import { useScanStore } from "@/stores/scanStore";

interface RecommendationBlocksProps {
  recommendations: Recommendation[];
  currentScore: number;
  scanId?: string;
}

export function RecommendationBlocks({ recommendations, currentScore, scanId }: RecommendationBlocksProps) {
  const [expandedId, setExpandedId] = useState<string | null>(recommendations[0]?.id ?? null);
  const { toggleRecommendation } = useScanStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (recommendations.length === 0) {
    return (
      <div id="recommendations" className="scroll-mt-24 border-t border-b border-border py-16 text-center">
        <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="font-medium tracking-tight">Nothing to recommend</h3>
        <p className="text-muted-foreground mt-1.5 text-sm">This room doesn't need any changes right now.</p>
      </div>
    );
  }

  const handleToggle = async (rec: Recommendation) => {
    if (!scanId) {
      toast.success(rec.completedAt ? "Marked as incomplete" : "Marked as complete");
      return;
    }
    setLoadingId(rec.id);
    try {
      const isDoneNow = await toggleRecommendation(scanId, rec.id);
      if (isDoneNow) {
        toast.success(`Completed "${rec.title}" (+${rec.expectedImpact} pts)`);
      } else {
        toast.info(`Marked "${rec.title}" as pending`);
      }
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  let runningScore = currentScore;

  return (
    <div id="recommendations" className="scroll-mt-24">
      <span className="field-tag text-muted-foreground block mb-3">Recommendations</span>
      <div className="border-t border-border">
        {recommendations.map((rec, index) => {
          const isExpanded = expandedId === rec.id;
          const isCompleted = !!rec.completedAt;

          if (!isCompleted) {
            runningScore = Math.min(100, runningScore + rec.expectedImpact);
          }
          const projectedAfterThis = runningScore;

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: Math.min(index, 5) * 0.06, duration: 0.5 }}
              className={`border-b border-border py-7 transition-colors ${isCompleted ? "bg-success/5" : ""}`}
            >
              <div
                className="flex items-start gap-5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <span className="tabular text-brand text-sm w-6 shrink-0 pt-1">{String(index + 1).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xl font-semibold tracking-tight ${isCompleted ? "line-through opacity-75" : ""}`}>
                        {rec.title}
                      </h4>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
                          <Check className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                    <span className={`field-tag ${isCompleted ? "text-muted-foreground" : "text-success"} whitespace-nowrap`}>
                      {isCompleted ? "Resolved" : `+${rec.expectedImpact} pts`}
                    </span>
                  </div>
                  <p className={`text-muted-foreground leading-relaxed ${!isExpanded ? "line-clamp-1" : ""}`}>{rec.description}</p>
                </div>
                <button className="shrink-0 text-muted-foreground p-1 mt-1">
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-2 pl-11">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-6">
                        {[
                          [Target, "Priority", rec.priority],
                          [DollarSign, "Est. cost", rec.estimatedCost],
                          [Wrench, "Difficulty", rec.difficulty],
                          [Clock, "Est. time", estimatedTimeLabel(rec.difficulty)],
                        ].map(([Icon, label, value]: any) => (
                          <div key={label} className="bg-card p-3.5 flex flex-col gap-1.5">
                            <span className="field-tag text-muted-foreground flex items-center gap-1.5">
                              <Icon className="h-3 w-3" /> {label}
                            </span>
                            <span className="text-sm font-medium">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 mb-6 text-sm">
                        <span className="text-muted-foreground">
                          {isCompleted ? "Action status:" : "Score after this change:"}
                        </span>
                        <span className="tabular font-semibold text-success text-base">
                          {isCompleted ? "Completed ✓" : projectedAfterThis}
                        </span>
                      </div>

                      {rec.whyDetected && (
                        <div className="border-l-2 border-success pl-4 mb-6">
                          <strong className="field-tag text-success flex items-center gap-1.5 mb-2">
                            <HelpCircle className="h-3.5 w-3.5" /> Why this is recommended
                          </strong>
                          <span className="text-foreground/75 leading-relaxed block text-sm">{rec.whyDetected}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={isCompleted ? "outline" : "brand"}
                          size="sm"
                          disabled={loadingId === rec.id}
                          onClick={() => handleToggle(rec)}
                        >
                          {isCompleted ? "Mark as Pending" : "Mark as Complete"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toast.info("Saved for later")}>
                          Save for Later
                        </Button>
                        <Button variant="ghost" size="sm" className="ml-auto text-brand" onClick={() => toast.info("Looking for local pros nearby")}>
                          Find Local Pros <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
