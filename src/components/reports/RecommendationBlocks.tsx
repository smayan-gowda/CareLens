import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, HelpCircle, ArrowRight, Wrench, Clock, DollarSign, Target, Check } from "lucide-react";
import { toast } from "sonner";
import type {
  DetectedObject,
  Hazard,
  Recommendation,
  ScanPhoto,
  SpatialFinding,
} from "@/types/ai";
import { estimatedTimeLabel } from "./reportMath";
import { RecommendationActionControls } from "@/components/plan/RecommendationActionControls";

interface RecommendationBlocksProps {
  recommendations: Recommendation[];
  currentScore: number;
  scanId?: string;
  homeId?: string;
  roomId?: string;
  photos?: ScanPhoto[];
  hazards?: Hazard[];
  detectedObjects?: DetectedObject[];
  spatialFindings?: SpatialFinding[];
  onSelectPhoto?: (photoId: string) => void;
  onSelectObservations?: (observationIds: string[], photoId?: string) => void;
  onSelectHazard?: (hazardId: string) => void;
  onSelectSpatialFinding?: (findingId: string) => void;
}

export function RecommendationBlocks({
  recommendations,
  currentScore,
  scanId,
  homeId = "",
  roomId = "",
  photos = [],
  hazards = [],
  detectedObjects = [],
  spatialFindings = [],
  onSelectPhoto,
  onSelectObservations,
  onSelectHazard,
  onSelectSpatialFinding,
}: RecommendationBlocksProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (recommendations.length === 0) {
    return (
      <div id="recommendations" className="scroll-mt-24 border-t border-b border-border py-16 text-center">
        <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="font-medium tracking-tight">Nothing to recommend</h3>
        <p className="text-muted-foreground mt-1.5 text-sm">This room doesn't need any changes right now.</p>
      </div>
    );
  }

  let runningScore = currentScore;

  return (
    <div id="recommendations" className="scroll-mt-24">
      <span className="field-tag text-muted-foreground block mb-3">Recommendations</span>
      <div className="border-t border-border">
        {recommendations.map((rec, index) => {
          const isExpanded = expandedId === rec.id;
          const isCompleted =
            (rec.actionStatus ?? (rec.completedAt ? 'follow_up_due' : 'open')) === 'verified';
          const evidencePhotoId = rec.evidencePhotoIds?.[0] ?? rec.imageId;
          const sourcePhoto = photos.find((photo) => photo.id === evidencePhotoId);
          const sourceObjects = detectedObjects.filter((object) =>
            rec.observationIds?.includes(object.id)
          );
          const sourceHazards = hazards.filter((hazard) =>
            rec.relatedHazardIds?.includes(hazard.id)
          );
          const sourceFindings = spatialFindings.filter((finding) =>
            rec.spatialFindingIds?.includes(finding.id)
          );

          runningScore = Math.min(100, runningScore + rec.expectedImpact);
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
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <span className="field-tag text-muted-foreground whitespace-nowrap">
                      Estimated potential: +{rec.expectedImpact} pts
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
                      <div className="mb-5 rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">Evidence-to-action trail</span>
                          <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                            {rec.provenance?.origin === "vision-model" ? "AI-generated action" : "Action source not recorded"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Recommendation record <code>{rec.id}</code>
                          {rec.provenance?.createdAt &&
                            ` · generated ${new Date(rec.provenance.createdAt).toLocaleString()}`}
                        </p>
                        {sourceObjects.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-foreground">Supporting visual observations</p>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              {sourceObjects.map((object) => (
                                <li key={object.id} className="flex flex-wrap items-center gap-2">
                                  <code>{object.id}</code>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-1 py-0 text-xs"
                                    onClick={() => {
                                      onSelectObservations?.([object.id], evidencePhotoId);
                                      document.getElementById("images")?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                    }}
                                  >
                                    Locate {object.name} in photo
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {sourceHazards.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {sourceHazards.map((hazard) => (
                              <Button
                                key={hazard.id}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onSelectHazard?.(hazard.id);
                                  document.getElementById("findings")?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }}
                              >
                                Open linked concern: {hazard.title}
                              </Button>
                            ))}
                          </div>
                        )}
                        {sourceFindings.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {sourceFindings.map((finding) => (
                              <Button
                                key={finding.id}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onSelectSpatialFinding?.(finding.id);
                                  document.getElementById("spatial-findings")?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }}
                              >
                                Open linked geometry: {finding.relationType.replaceAll("-", " ")}
                              </Button>
                            ))}
                          </div>
                        )}
                        {sourceObjects.length === 0 && sourceHazards.length === 0 && sourceFindings.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No observation, concern, or geometric finding is explicitly linked to this action.
                            The photo is context only, not proof of the recommendation&apos;s cause.
                          </p>
                        )}
                        {sourcePhoto && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onSelectPhoto?.(sourcePhoto.id);
                              document.getElementById("images")?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }}
                          >
                            View source photo: {sourcePhoto.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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

                      <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
                        <span>
                          Illustrative score scenario only: {projectedAfterThis}/100. Action status never changes the measured safety score.
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

                      {scanId && !scanId.startsWith("sample-") && (
                        <RecommendationActionControls
                          recommendation={rec}
                          scanId={scanId}
                          homeId={homeId}
                          roomId={roomId}
                        />
                      )}
                      {scanId?.startsWith("sample-") && (
                        <p className="text-xs text-muted-foreground">
                          Reference assessment actions are examples; create your own room assessment to track these steps.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
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
