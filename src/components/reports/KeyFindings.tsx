import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { 
  Crosshair, 
  Info, 
  ChevronDown, 
  Wrench, 
  Check, 
  Eye, 
  HelpCircle, 
  ThumbsUp, 
  XCircle, 
  AlertCircle,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import type {
  DetectedObject,
  EvidenceReview,
  Hazard,
  Recommendation,
  ScanPhoto,
  SpatialFinding,
} from "@/types/ai";
import { severityColor, severityLabel, estimatedImprovement } from "./reportMath";

function getEvidenceStateBadge(hazard: Hazard): { label: string; style: string } {
  const state = hazard.feedback === "needs_review" ? "Needs Review" : hazard.boundingBox ? "Geometrically Supported" : "Observed";
  switch (state) {
    case "Observed":
      return { label: "Observed", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" };
    case "Geometrically Supported":
      return { label: "Geometrically Supported", style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" };
    case "Needs Review":
    default:
      return { label: "Needs Review / Ambiguous", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" };
  }
}

interface KeyFindingsProps {
  hazards: Hazard[];
  recommendations: Recommendation[];
  image?: string;
  photos?: Array<ScanPhoto & { image: string }>;
  spatialFindings?: SpatialFinding[];
  evidenceReviews?: EvidenceReview[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string | null) => void;
  onSelectSpatialFinding?: (id: string) => void;
  onSelectObservations?: (observationIds: string[], photoId?: string) => void;
  detectedObjects?: DetectedObject[];
  onFeedbackChange?: (hazardId: string, feedback: "helpful" | "not_present" | "needs_review") => void;
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

function FindingImage({ image, box }: { image?: string; box?: Hazard["boundingBox"] }) {
  if (!image) {
    return <div className="w-full h-full bg-muted" />;
  }
  if (!box) {
    return <img src={image} className="w-full h-full object-cover" alt="Full room view" />;
  }

  let normBox = { ...box };
  if (normBox.x <= 1 && normBox.y <= 1 && normBox.width <= 1 && normBox.height <= 1 && normBox.width > 0) {
    normBox = { x: normBox.x * 100, y: normBox.y * 100, width: normBox.width * 100, height: normBox.height * 100 };
  } else if (normBox.x > 100 || normBox.y > 100 || normBox.width > 100 || normBox.height > 100) {
    normBox = { x: normBox.x / 10, y: normBox.y / 10, width: normBox.width / 10, height: normBox.height / 10 };
  }

  const cx = Math.min(100, Math.max(0, normBox.x + normBox.width / 2));
  const cy = Math.min(100, Math.max(0, normBox.y + normBox.height / 2));
  const zoom = Math.min(3.2, Math.max(1.5, 90 / Math.max(normBox.width, normBox.height, 20)));
  return (
    <img
      src={image}
      className="w-full h-full object-cover"
      style={{ transform: `scale(${zoom})`, transformOrigin: `${cx}% ${cy}%` }}
      alt="Cropped detail of detected concern"
    />
  );
}

export function KeyFindings({
  hazards,
  recommendations,
  image,
  photos = [],
  spatialFindings = [],
  evidenceReviews = [],
  selectedHazardId,
  onSelectHazard,
  onSelectSpatialFinding,
  onSelectObservations,
  detectedObjects = [],
  onFeedbackChange,
}: KeyFindingsProps) {
  if (hazards.length === 0) {
    return (
      <div id="findings" className="scroll-mt-24 border-t border-b border-border py-16 text-center space-y-3">
        <Check className="h-7 w-7 text-success mx-auto" strokeWidth={2} />
        <h3 className="text-xl font-medium tracking-tight">No visible concerns detected</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          The submitted photograph does not show obvious visible tripping hazards or clear pathway obstructions.
          Always conduct an in-person walkthrough to test stability, floor grip, and lighting at different times of day.
        </p>
      </div>
    );
  }

  return (
    <div id="findings" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="field-tag text-muted-foreground block mb-1">Detailed Inspection</span>
          <h2 className="text-2xl font-semibold tracking-tight">Observed Concerns & Practical Checks</h2>
        </div>
        <span className="text-xs text-muted-foreground tabular">
          {hazards.length} item{hazards.length !== 1 ? "s" : ""} identified
        </span>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Select a finding to see what the photo shows, why it may matter, what the image cannot confirm,
        and a practical next check. Your review is separate from the model&apos;s finding.
      </p>

      {/* Preliminary guidance banner */}
      <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-start gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Preliminary Guidance Notice</p>
          <p className="leading-relaxed">
            These findings highlight visible elements that may pose safety or accessibility concerns. A 2D photograph
            cannot confirm physical properties such as grab bar weight capacity, floor slip-resistance when wet, or
            carpet adhesion. Use these findings as discussion points with an occupational therapist or licensed professional.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        {hazards.map((hazard, idx) => {
          const isExpanded = selectedHazardId === hazard.id;
          const improvement = estimatedImprovement(hazard, recommendations);
          const evidencePhoto = photos.find((photo) => photo.id === hazard.imageId);
          const evidencePhotoIndex = evidencePhoto ? photos.indexOf(evidencePhoto) : 0;
          const evidenceObjects = detectedObjects.filter(
            (object) =>
              object.imageId === hazard.imageId ||
              (!object.imageId && evidencePhotoIndex === 0)
          );
          const resolvedBox = resolveHazardBox(hazard, evidenceObjects);
          const linkedObservations = evidenceObjects.filter((object) =>
            hazard.observationIds?.includes(object.id)
          );
          const linkedFindings = spatialFindings.filter((finding) =>
            hazard.spatialFindingIds?.includes(finding.id)
          );
          const hazardReviews = evidenceReviews.filter(
            (review) => review.targetType === "hazard" && review.targetId === hazard.id
          );
          const feedback = hazardReviews.length > 0
            ? {
                confirmed: "helpful",
                disputed: "not_present",
                needs_review: "needs_review",
              }[hazardReviews[hazardReviews.length - 1].status]
            : hazard.feedback === "needs_review"
              ? undefined
              : hazard.feedback;
          const legacyReviewState = hazardReviews.length === 0 && hazard.feedback === "needs_review";
          const isNotPresent = feedback === "not_present";

          return (
            <motion.div
              key={hazard.id}
              layout
              className={`border-b border-border py-8 md:py-10 transition-colors ${
                isNotPresent ? "opacity-60 bg-muted/15" : ""
              }`}
            >
              <div className="grid md:grid-cols-12 gap-6 md:gap-10">
                {/* Image detail */}
                <div
                  className="md:col-span-4 cursor-pointer"
                  onClick={() => onSelectHazard(isExpanded ? null : hazard.id)}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-900 rounded-lg border border-border/80 relative">
                    <FindingImage image={evidencePhoto?.image || image} box={resolvedBox} />
                    {resolvedBox && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 text-white/90 px-2 py-0.5 rounded backdrop-blur-sm">
                        Area Annotated
                      </span>
                    )}
                  </div>
                </div>

                {/* Finding Details */}
                <div className="md:col-span-8 flex flex-col">
                  <div
                    className="flex items-start justify-between gap-4 cursor-pointer"
                    onClick={() => onSelectHazard(isExpanded ? null : hazard.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <span className="tabular text-brand text-sm font-mono">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className={`field-tag ${severityColor(hazard.severity)} font-medium`}>
                          {severityLabel(hazard.severity)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="field-tag text-muted-foreground">{hazard.category}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {hazard.provenance?.origin === "vision-model"
                            ? "Vision model"
                            : "Source not recorded"}
                        </span>

                        {isNotPresent && (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Marked as Not Present
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">
                        {hazard.title}
                      </h3>
                    </div>
                    <button
                      aria-label="Toggle details"
                      className="shrink-0 text-muted-foreground p-1 mt-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>
                  </div>

                  {/* Summary prose */}
                  <p className="text-muted-foreground leading-relaxed mt-3 max-w-2xl text-sm md:text-base">
                    {hazard.description}
                  </p>

                  {/* Location & Impact Bar */}
                  <div className="grid sm:grid-cols-2 gap-3 mt-4 p-3 bg-muted/20 border border-border/60 rounded-lg text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium">Where: </span>
                      <span className="text-foreground">{hazard.location}</span>
                    </div>
                    {evidencePhoto && photos.length > 1 && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Evidence photo: <span className="font-medium text-foreground">{evidencePhoto.label}</span>
                      </p>
                    )}
                    <div>
                      <span className="text-muted-foreground font-medium">Potential Concern: </span>
                      <span className="text-foreground">{hazard.potentialConcern || hazard.impact}</span>
                    </div>
                  </div>

                  {/* Human feedback controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium mr-1">
                        Your review · does not change the score:
                      </span>
                      <Button
                        size="sm"
                        variant={feedback === "helpful" ? "secondary" : "outline"}
                        className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer ${
                          feedback === "helpful" ? "border-brand/40 text-brand bg-brand/10 font-medium" : ""
                        }`}
                        onClick={() => onFeedbackChange?.(hazard.id, "helpful")}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Looks right</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={feedback === "not_present" ? "secondary" : "outline"}
                        className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer ${
                          feedback === "not_present" ? "border-destructive/40 text-destructive bg-destructive/10 font-medium" : ""
                        }`}
                        onClick={() => onFeedbackChange?.(hazard.id, "not_present")}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Not present</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={feedback === "needs_review" ? "secondary" : "outline"}
                        className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer ${
                          feedback === "needs_review" ? "border-warning/40 text-warning bg-warning/10 font-medium" : ""
                        }`}
                        onClick={() => onFeedbackChange?.(hazard.id, "needs_review")}
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>Needs review</span>
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="text-success font-medium">+{improvement} pts</span> if addressed
                    </div>
                  </div>
                  {legacyReviewState && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      This scan has a legacy unresolved state, but no review event was saved to identify its source.
                    </p>
                  )}

                  {/* Expanded evidence and physical verification notes */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 mt-6 border-t border-dashed border-border grid sm:grid-cols-2 gap-6 text-xs">
                          {/* Visible Evidence & Potential Concern */}
                          <div className="space-y-4">
                            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-1.5">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-brand" /> Direct Visual Observation
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {hazard.visibleObservation || hazard.reasoning || hazard.description}
                              </p>
                            </div>

                            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 space-y-1.5">
                              <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5" /> Requires In-Person Physical Check
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {hazard.verificationRequirement ||
                                  hazard.humanVerificationNote ||
                                  "Confirm grip, mounting firmness, and actual clearance by direct physical touch."}
                              </p>
                            </div>
                          </div>

                          {/* Limitations & Next Steps */}
                          <div className="space-y-4 flex flex-col justify-between">
                            <div className="p-3 bg-card rounded-lg border border-border space-y-1.5">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-brand" /> Actionable Next Step
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {hazard.suggestedNextStep ||
                                  hazard.suggestedAction ||
                                  (recommendations.find((r) => r.relatedHazardIds?.includes(hazard.id))?.description ||
                                    "Inspect this area with the resident to evaluate if it impedes natural walking transitions.")}
                              </p>
                            </div>

                            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 space-y-1.5">
                              <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" /> 2D Photo Analysis Limitations
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {hazard.limitations ||
                                  "2D photograph cannot evaluate wall anchor strength, wet slip resistance, or structural framing under surface."}
                              </p>
                            </div>

                            {hazard.objectsInvolved && hazard.objectsInvolved.length > 0 && (
                              <div className="pt-1">
                                <span className="text-muted-foreground block mb-1.5 font-medium">Associated Objects:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {hazard.objectsInvolved.map((obj, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[11px]">
                                      {obj}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                          <div>
                            <p className="font-semibold text-foreground">Evidence trail</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Hazard record <code>{hazard.id}</code>
                              {hazard.provenance?.createdAt &&
                                ` · model output ${new Date(hazard.provenance.createdAt).toLocaleString()}`}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 font-medium text-foreground">Linked visual observations</p>
                            {linkedObservations.length > 0 ? (
                              <ul className="space-y-1 text-muted-foreground">
                                {linkedObservations.map((object) => (
                                  <li key={object.id} className="flex flex-wrap items-center gap-2">
                                    <code className="text-[10px]">{object.id}</code>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto px-1 py-0 text-xs"
                                      onClick={() =>
                                        onSelectObservations?.([object.id], hazard.imageId)
                                      }
                                    >
                                      Locate {object.name} in photo
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">
                                No detected-object record was explicitly linked to this hazard.
                              </p>
                            )}
                          </div>
                          {linkedFindings.length > 0 && (
                            <div>
                              <p className="mb-1 font-medium text-foreground">Linked geometric findings</p>
                              <div className="flex flex-wrap gap-2">
                                {linkedFindings.map((finding) => (
                                  <Button
                                    key={finding.id}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSelectSpatialFinding?.(finding.id)}
                                  >
                                    {finding.relationType.replaceAll("-", " ")}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="mb-1 font-medium text-foreground">User review history</p>
                            {hazardReviews.length > 0 ? (
                              <ul className="space-y-1 text-muted-foreground">
                                {hazardReviews.map((review) => (
                                  <li key={review.id}>
                                    User {review.status.replaceAll("_", " ")} ·{" "}
                                    {new Date(review.reviewedAt).toLocaleString()}
                                    {review.note ? ` · ${review.note}` : ""}
                                    <code className="ml-1 text-[10px]">{review.id}</code>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">
                                No explicit user-review event is stored for this scan.
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
