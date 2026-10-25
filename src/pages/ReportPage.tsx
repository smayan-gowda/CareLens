import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useScanStore } from "@/stores/scanStore";
import { useHomeStore } from "@/stores/useHomeStore";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Award, Info, Sparkles } from "lucide-react";
import { ReportNav } from "@/components/reports/ReportNav";
import { ReportHero } from "@/components/reports/ReportHero";
import { OverallScoreCard } from "@/components/reports/OverallScoreCard";
import { ExecutiveSummary } from "@/components/reports/ExecutiveSummary";
import { CategoryBreakdown } from "@/components/reports/CategoryBreakdown";
import { KeyFindings } from "@/components/reports/KeyFindings";
import { SpatialFindings } from "@/components/reports/SpatialFindings";
import { RecommendationBlocks } from "@/components/reports/RecommendationBlocks";
import { BeforeAfterPreview } from "@/components/reports/BeforeAfterPreview";
import { ReportAnalytics } from "@/components/reports/ReportAnalytics";
import { ExportCenter } from "@/components/reports/ExportCenter";
import { AccessibilitySummary } from "@/components/reports/AccessibilitySummary";
import { AiConfidencePanel } from "@/components/reports/AiConfidencePanel";
import { ReportFooter } from "@/components/reports/ReportFooter";
import { InteractiveImage } from "@/components/reports/InteractiveImage";
import { ReportTimelineSection } from "@/components/reports/ReportTimelineSection";
import { getSampleAssessment } from "@/data/sampleAssessments";
import type { Hazard, ScanResult } from "@/types/ai";
import { getScoreFormulaBreakdown } from "@/components/reports/reportMath";

export function ReportPage() {
  const { homeId, roomId, reportId } = useParams();
  const { getScanById, getScansForRoom, updateHazardFeedback, loading: scanLoading } = useScanStore();
  const { homes, loading: homeLoading } = useHomeStore();

  // Check store first, fallback to sample assessment data
  const rawScan = useMemo(() => {
    const fromStore = getScanById(reportId || "");
    if (fromStore) return fromStore;
    const sample = getSampleAssessment(reportId || "");
    return sample?.scanResult;
  }, [getScanById, reportId]);

  const isSample = useMemo(() => {
    return Boolean(
      reportId?.startsWith("sample-") ||
        rawScan?.id?.startsWith("sample-") ||
        getSampleAssessment(reportId || "")
    );
  }, [reportId, rawScan]);

  const [activeHazards, setActiveHazards] = useState<Hazard[]>([]);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);

  useEffect(() => {
    if (rawScan?.hazards) {
      setActiveHazards(rawScan.hazards);
    }
  }, [rawScan]);

  const handleFeedbackChange = (
    hazardId: string,
    feedback: "helpful" | "not_present" | "needs_review"
  ) => {
    setActiveHazards((prev) =>
      prev.map((h) => (h.id === hazardId ? { ...h, feedback } : h))
    );
    if (rawScan?.id) {
      updateHazardFeedback(rawScan.id, hazardId, feedback);
    }
  };

  const calculatedScore = useMemo(() => {
    if (!activeHazards || activeHazards.length === 0) return rawScan?.safetyScore || 100;
    const breakdown = getScoreFormulaBreakdown(activeHazards);
    return breakdown.calculatedScore;
  }, [activeHazards, rawScan]);

  // Construct active dynamic scan object with user feedbacks and adjusted score
  const dynamicScan = useMemo<ScanResult | null>(() => {
    if (!rawScan) return null;
    return {
      ...rawScan,
      safetyScore: calculatedScore,
      hazards: activeHazards,
    };
  }, [rawScan, calculatedScore, activeHazards]);

  const currentHome = homes.find((h) => h.id === homeId);
  const currentRoom = currentHome?.rooms.find((r) => r.id === roomId);

  const roomScans = useMemo(() => getScansForRoom(roomId || ""), [getScansForRoom, roomId]);

  const previousScore = useMemo(() => {
    if (!dynamicScan) return undefined;
    const priorCompleted = roomScans
      .filter(
        (s) =>
          s.status === "Completed" &&
          s.id !== dynamicScan.id &&
          new Date(s.createdAt) < new Date(dynamicScan.createdAt)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return priorCompleted[0]?.safetyScore;
  }, [roomScans, dynamicScan]);

  if (scanLoading || homeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-sm text-muted-foreground mt-4 font-medium">Preparing safety report...</p>
      </div>
    );
  }

  if (!dynamicScan) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-medium tracking-tight">Report Not Found</h2>
        <p className="text-muted-foreground mt-2">The safety analysis report could not be located.</p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" asChild>
            <Link to="/scan">Back to Scan Hub</Link>
          </Button>
          <Button variant="brand" asChild>
            <Link to="/reports/sample-bathroom-master">View Sample Assessment</Link>
          </Button>
        </div>
      </div>
    );
  }

  const mainImage = dynamicScan.images?.[0] || (dynamicScan as any).originalImage;

  const oneLiner =
    dynamicScan.hazards.filter((h) => h.feedback !== "not_present").length === 0
      ? `Your ${(dynamicScan.roomType || "room").toLowerCase()} has no active visible hazards flagged.`
      : dynamicScan.hazards.filter(
          (h) => h.feedback !== "not_present" && (h.severity === "Critical" || h.severity === "High")
        ).length > 0
      ? `Your ${(dynamicScan.roomType || "room").toLowerCase()} displays specific areas where targeted safety improvements will reduce risk.`
      : `Your ${(dynamicScan.roomType || "room").toLowerCase()} has minor recommendations worth review.`;

  return (
    <div className="animate-in fade-in duration-500">
      <ReportNav />

      {/* Demonstration Case Study Banner */}
      {isSample && (
        <div className="bg-brand/10 border-b border-brand/20 py-3 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-brand">
              <Award className="w-4 h-4 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">
                CareLens AI Case Study Demonstration
              </span>
              <span className="hidden sm:inline text-muted-foreground">
                — Verified pre-annotated assessment case study.
              </span>
            </div>
            <Link
              to="/scan"
              className="text-brand hover:underline font-medium shrink-0"
            >
              Run New Assessment →
            </Link>
          </div>
        </div>
      )}

      <ReportHero
        scan={dynamicScan}
        mainImage={mainImage}
        homeName={isSample ? "CareLens Demonstration Residence" : currentHome?.name}
        roomName={isSample ? `${dynamicScan.roomType} (Reference Case Study)` : currentRoom?.name}
        homeId={homeId || ""}
        roomId={roomId || ""}
        oneLiner={oneLiner}
        isSample={isSample}
      />

      <div className="max-w-5xl mx-auto px-5 md:px-10 space-y-16 md:space-y-24 py-16 md:py-20">
        <OverallScoreCard scan={dynamicScan} previousScore={previousScore} />

        <ExecutiveSummary scan={dynamicScan} />

        <SpatialFindings findings={dynamicScan.spatialFindings || []} />

        <KeyFindings
          hazards={activeHazards}
          recommendations={dynamicScan.recommendations}
          image={mainImage}
          selectedHazardId={selectedHazardId}
          onSelectHazard={setSelectedHazardId}
          detectedObjects={dynamicScan.detectedObjects}
          onFeedbackChange={handleFeedbackChange}
        />

        <div id="images" className="scroll-mt-24 space-y-10">
          <span className="field-tag text-muted-foreground block">Interactive Image & Bounding Boxes</span>
          <InteractiveImage
            image={mainImage}
            hazards={activeHazards.filter((h) => h.feedback !== "not_present")}
            detectedObjects={dynamicScan.detectedObjects}
            selectedHazardId={selectedHazardId}
            onSelectHazard={setSelectedHazardId}
          />

          <div className="grid md:grid-cols-2 gap-10 pt-4">
            <div>
              <span className="field-tag text-muted-foreground block mb-4">Improvement Visualization</span>
              <BeforeAfterPreview
                originalImage={mainImage}
                recommendations={dynamicScan.recommendations}
                hazards={activeHazards}
                detectedObjects={dynamicScan.detectedObjects}
              />
            </div>
            <div>
              <span className="field-tag text-muted-foreground block mb-4">Accessibility Grade</span>
              <AccessibilitySummary score={dynamicScan.subScores?.accessibility} />
            </div>
          </div>

          <div>
            <span className="field-tag text-muted-foreground block mb-4">Category Breakdown</span>
            <CategoryBreakdown subScores={dynamicScan.subScores} />
          </div>
        </div>

        <RecommendationBlocks
          recommendations={dynamicScan.recommendations}
          currentScore={dynamicScan.safetyScore}
          scanId={dynamicScan.id}
        />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch pt-16 border-t border-border">
          <div className="space-y-10 lg:pt-0 flex flex-col h-full">
            <ReportTimelineSection
              currentScan={dynamicScan}
              roomScans={roomScans}
              homeId={homeId || ""}
              roomId={roomId || ""}
            />
            <AiConfidencePanel confidence={dynamicScan.roomConfidence} trace={dynamicScan.assessmentTrace} className="flex-1" />
          </div>

          <div className="space-y-10 lg:pt-0 flex flex-col h-full">
            <ReportAnalytics hazards={activeHazards} subScores={dynamicScan.subScores} />
          </div>
        </div>

        <div>
          <ExportCenter
            scan={dynamicScan}
            homeName={isSample ? "CareLens Demonstration Residence" : currentHome?.name}
            roomName={isSample ? `${dynamicScan.roomType} (Sample)` : currentRoom?.name}
          />
        </div>

        <ReportFooter />
      </div>
    </div>
  );
}
