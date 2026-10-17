import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Crosshair, Info, ChevronDown, DollarSign, Wrench, Check } from "lucide-react";
import type { Hazard, Recommendation, DetectedObject } from "@/types/ai";
import { severityColor, severityLabel, estimatedImprovement } from "./reportMath";

interface KeyFindingsProps {
  hazards: Hazard[];
  recommendations: Recommendation[];
  image?: string;
  selectedHazardId: string | null;
  onSelectHazard: (id: string | null) => void;
  detectedObjects?: DetectedObject[];
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

/** A zoomed, cropped read of the source photo centered on a hazard's
 * bounding box — a real crop of the real image, not a placeholder. Falls
 * back to the full frame when no box is available. */
function FindingImage({ image, box }: { image?: string; box?: Hazard["boundingBox"] }) {
  if (!image) {
    return <div className="w-full h-full bg-muted" />;
  }
  if (!box) {
    return <img src={image} className="w-full h-full object-cover" alt="" />;
  }
  
  // Safe normalization inline
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
      alt=""
    />
  );
}

export function KeyFindings({ hazards, recommendations, image, selectedHazardId, onSelectHazard, detectedObjects = [] }: KeyFindingsProps) {
  if (hazards.length === 0) {
    return (
      <div id="findings" className="scroll-mt-24 border-t border-b border-border py-16 text-center">
        <Check className="h-6 w-6 text-success mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="font-medium tracking-tight">No hazards detected</h3>
        <p className="text-muted-foreground mt-1.5 text-sm">This room appears well-configured for safety.</p>
      </div>
    );
  }

  return (
    <div id="findings" className="scroll-mt-24">
      <span className="field-tag text-muted-foreground block mb-3">Key Findings</span>
      <div className="border-t border-border">
        {hazards.map((hazard, idx) => {
          const isExpanded = selectedHazardId === hazard.id;
          const improvement = estimatedImprovement(hazard, recommendations);
          const resolvedBox = resolveHazardBox(hazard, detectedObjects);
          return (
            <motion.div
              key={hazard.id}
              layout
              className="border-b border-border py-8 md:py-10"
            >
              <div
                className="grid md:grid-cols-12 gap-6 md:gap-10 cursor-pointer"
                onClick={() => onSelectHazard(isExpanded ? null : hazard.id)}
              >
                <div className="md:col-span-4">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                    <FindingImage image={image} box={resolvedBox} />
                  </div>
                </div>

                <div className="md:col-span-8 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <span className="tabular text-brand text-sm">{String(idx + 1).padStart(2, "0")}</span>
                        <span className={`field-tag ${severityColor(hazard.severity)}`}>{severityLabel(hazard.severity)}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="field-tag text-muted-foreground">{hazard.category}</span>
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight">{hazard.title}</h3>
                    </div>
                    <button className="shrink-0 text-muted-foreground p-1 mt-1">
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mt-4 max-w-2xl">{hazard.description}</p>

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mt-5 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Crosshair className="h-3.5 w-3.5" /> {hazard.confidence}% confidence
                    </span>
                    <span className="text-success font-medium">+{improvement} pts if resolved</span>
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
                        <div className="pt-6 mt-6 border-t border-dashed border-border grid sm:grid-cols-2 gap-8">
                          <div className="space-y-5">
                            <div>
                              <span className="field-tag text-muted-foreground block mb-1.5">Location</span>
                              <span className="text-sm font-medium">{hazard.location}</span>
                            </div>
                            {hazard.objectsInvolved && hazard.objectsInvolved.length > 0 && (
                              <div>
                                <span className="field-tag text-muted-foreground block mb-2">Objects involved</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {hazard.objectsInvolved.map((obj, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 bg-muted text-muted-foreground">{obj}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Why it matters:</span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed -mt-3">{hazard.impact}</p>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex-1">
                              <span className="field-tag text-muted-foreground flex items-center gap-1.5 mb-2">
                                <Info className="h-3.5 w-3.5" /> Reasoning
                              </span>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {hazard.reasoning || hazard.impact}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-auto pt-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Wrench className="w-3.5 h-3.5 mr-1.5" /> See the fix
                              </Button>
                            </div>
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
