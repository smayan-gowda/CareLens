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
import { AssessmentComparison } from "@/components/reports/AssessmentComparison";
import { EvidenceJourney } from "@/components/reports/EvidenceJourney";
import { getSampleAssessment } from "@/data/sampleAssessments";
import type { EvidenceReview, EvidenceReviewStatus, Hazard, ScanResult } from "@/types/ai";
import { getRecordedAssessmentScore } from "@/components/reports/reportMath";
import { analyzeSpatialRelationships } from "@/services/ai/spatialAnalyzer";
import type { SpatialFindingReviewStatus } from "@/types/ai";
import { toast } from "sonner";

function createLocalReview(
  targetType: EvidenceReview["targetType"],
  targetId: string,
  status: EvidenceReviewStatus,
  imageId?: string
): EvidenceReview {
  return {
    id: `review-${crypto.randomUUID()}`,
    targetType,
    targetId,
    status,
    origin: "user",
    reviewedAt: new Date().toISOString(),
    imageId,
  };
}

export function ReportPage() {
  const { homeId, roomId, reportId } = useParams();
  const {
    scans,
    getScanById,
    getScansForRoom,
    updateHazardFeedback,
    updateSpatialFindingReview,
    loading: scanLoading,
  } = useScanStore();
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
  const [activeEvidenceReviews, setActiveEvidenceReviews] = useState<EvidenceReview[]>([]);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [activeSpatialFindings, setActiveSpatialFindings] = useState<NonNullable<ScanResult["spatialFindings"]>>([]);
  const [selectedSpatialFindingId, setSelectedSpatialFindingId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState("");
  const [selectedObservationIds, setSelectedObservationIds] = useState<string[]>([]);

  useEffect(() => {
    if (rawScan?.hazards) {
      setActiveHazards(rawScan.hazards);
      setSelectedHazardId(null);
    }
    setActiveEvidenceReviews(rawScan?.evidenceReviews ?? []);
  }, [rawScan]);

  const initialSpatialFindings = useMemo(
    () => rawScan?.spatialFindings ?? analyzeSpatialRelationships(rawScan?.detectedObjects || []),
    [rawScan]
  );

  useEffect(() => {
    setActiveSpatialFindings(initialSpatialFindings);
  }, [initialSpatialFindings]);

  const handleFeedbackChange = async (
    hazardId: string,
    feedback: "helpful" | "not_present" | "needs_review"
  ) => {
    const previousHazard = activeHazards.find((item) => item.id === hazardId);
    setActiveHazards((prev) =>
      prev.map((h) => (h.id === hazardId ? { ...h, feedback } : h))
    );
    const status: EvidenceReviewStatus =
      feedback === "helpful" ? "confirmed" : feedback === "not_present" ? "disputed" : "needs_review";
    try {
      const review =
        isSample || !rawScan?.id
          ? createLocalReview("hazard", hazardId, status, previousHazard?.imageId)
          : await updateHazardFeedback(rawScan.id, hazardId, feedback);
      if (review) {
        setActiveEvidenceReviews((reviews) => [...reviews, review]);
        setActiveHazards((hazards) =>
          hazards.map((hazard) =>
            hazard.id === hazardId
              ? {
                  ...hazard,
                  reviewStatus: status,
                  reviewIds: [...(hazard.reviewIds ?? []), review.id],
                }
              : hazard
          )
        );
      }
    } catch {
      setActiveHazards((hazards) =>
        hazards.map((hazard) =>
          hazard.id === hazardId && previousHazard ? previousHazard : hazard
        )
      );
      toast.error("Couldn't save your review. Please try again.");
    }
  };

  const handleSelectHazard = (hazardId: string | null) => {
    setSelectedHazardId(hazardId);
    if (!hazardId) {
      setSelectedObservationIds([]);
      return;
    }
    setSelectedSpatialFindingId(null);
    const hazard = activeHazards.find((item) => item.id === hazardId);
    if (hazard?.imageId) setSelectedPhotoId(hazard.imageId);
    setSelectedObservationIds(hazard?.observationIds ?? []);
  };

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotoId(photoId);
    setSelectedHazardId(null);
    setSelectedSpatialFindingId(null);
    setSelectedObservationIds([]);
  };

  const handleOpenPhotoEvidence = (photoId: string) => {
    handleSelectPhoto(photoId);
    document.getElementById("images")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleReviewPhotoFinding = (
    photoId: string,
    hazardId?: string,
    spatialFindingId?: string
  ) => {
    setSelectedPhotoId(photoId);
    if (hazardId) {
      handleSelectHazard(hazardId);
      document.getElementById("findings")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }
    if (spatialFindingId) {
      handleOpenSpatialFinding(spatialFindingId);
      return;
    }
    handleOpenPhotoEvidence(photoId);
  };

  const handleOpenActionPlan = () => {
    document.getElementById("recommendations")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSelectObservations = (observationIds: string[], photoId?: string) => {
    if (photoId) setSelectedPhotoId(photoId);
    setSelectedHazardId(null);
    setSelectedSpatialFindingId(null);
    setSelectedObservationIds(observationIds);
    document.getElementById("images")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleSpatialReviewChange = async (
    findingId: string,
    reviewStatus: Exclude<SpatialFindingReviewStatus, "unreviewed">
  ) => {
    if (isSample) {
      const finding = activeSpatialFindings.find((item) => item.id === findingId);
      const review = createLocalReview(
        "spatial-finding",
        findingId,
        reviewStatus,
        finding?.imageId
      );
      setActiveSpatialFindings((findings) =>
        findings.map((finding) =>
          finding.id === findingId
            ? { ...finding, reviewStatus, reviewIds: [...(finding.reviewIds ?? []), review.id] }
            : finding
        )
      );
      setActiveEvidenceReviews((reviews) => [...reviews, review]);
      return;
    }

    if (!rawScan?.id) return;
    try {
      const review = await updateSpatialFindingReview(
        rawScan.id,
        findingId,
        reviewStatus,
        activeSpatialFindings
      );
      if (review) setActiveEvidenceReviews((reviews) => [...reviews, review]);
      setActiveSpatialFindings((findings) =>
        findings.map((finding) =>
          finding.id === findingId
            ? {
                ...finding,
                reviewStatus,
                reviewIds: review
                  ? [...(finding.reviewIds ?? []), review.id]
                  : finding.reviewIds,
              }
            : finding
        )
      );
    } catch {
      toast.error("Couldn't save your review. Please try again.");
    }
  };

  const handleSelectSpatialFinding = (findingId: string | null) => {
    setSelectedSpatialFindingId(findingId);
    if (findingId) {
      const finding = activeSpatialFindings.find((item) => item.id === findingId);
      if (finding?.imageId) setSelectedPhotoId(finding.imageId);
      setSelectedObservationIds(finding?.objectIds ?? []);
      setSelectedHazardId(null);
      document.getElementById("images")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleOpenSpatialFinding = (findingId: string) => {
    setSelectedSpatialFindingId(findingId);
    const finding = activeSpatialFindings.find((item) => item.id === findingId);
    if (finding?.imageId) setSelectedPhotoId(finding.imageId);
    setSelectedObservationIds(finding?.objectIds ?? []);
    setSelectedHazardId(null);
    document.getElementById("spatial-findings")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const recordedScore = useMemo(
    () => (rawScan ? getRecordedAssessmentScore(rawScan) : 100),
    [rawScan]
  );

  // Keep the scan score fixed; user reviews are stored independently as evidence.
  const dynamicScan = useMemo<ScanResult | null>(() => {
    if (!rawScan) return null;
    return {
      ...rawScan,
      safetyScore: recordedScore,
      initialSafetyScore: recordedScore,
      hazards: activeHazards,
      spatialFindings: activeSpatialFindings,
      evidenceReviews: activeEvidenceReviews,
    };
  }, [rawScan, recordedScore, activeHazards, activeSpatialFindings, activeEvidenceReviews]);

  const reportPhotos = useMemo(
    () =>
      (dynamicScan?.images || []).map((image, index) => ({
        ...(dynamicScan.photos?.[index] || {
          id: `legacy-photo-${dynamicScan.id}-${index}`,
          role: index === 0 ? ("overview" as const) : ("detail" as const),
          label: index === 0 ? "Room overview" : `Photo ${index + 1}`,
        }),
        image,
      })),
    [dynamicScan]
  );
  const activePhoto = reportPhotos.find((photo) => photo.id === selectedPhotoId) || reportPhotos[0];

  useEffect(() => {
    if (reportPhotos.length > 0 && !reportPhotos.some((photo) => photo.id === selectedPhotoId)) {
      setSelectedPhotoId(reportPhotos[0].id);
    }
  }, [reportPhotos, selectedPhotoId]);

  const currentHome = homes.find((h) => h.id === homeId);
  const currentRoom = currentHome?.rooms.find((r) => r.id === roomId);

  const roomScans = useMemo(() => getScansForRoom(roomId || ""), [getScansForRoom, roomId]);
  const comparisonSourceScan = useMemo(() => {
    if (!dynamicScan) return undefined;
    const scansInStore = Object.values(scans).flat();
    if (dynamicScan.followUpFromScanId) {
      return (
        getScanById(dynamicScan.followUpFromScanId) ??
        scansInStore.find((scan) => scan.id === dynamicScan.followUpFromScanId)
      );
    }
    return scansInStore.find((scan) =>
      scan.recommendations?.some(
        (recommendation) => recommendation.followUpScanId === dynamicScan.id
      )
    );
  }, [dynamicScan, getScanById, scans]);

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
    return priorCompleted[0] ? getRecordedAssessmentScore(priorCompleted[0]) : undefined;
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
  const activePhotoIndex = Math.max(
    0,
    reportPhotos.findIndex((photo) => photo.id === activePhoto?.id)
  );
  const photoScoped = <T extends { imageId?: string }>(items: T[]) =>
    items.filter(
      (item) => item.imageId === activePhoto?.id || (!item.imageId && activePhotoIndex === 0)
    );

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

        {comparisonSourceScan && (
          <AssessmentComparison before={comparisonSourceScan} after={dynamicScan} />
        )}

        <ExecutiveSummary scan={dynamicScan} />

        <EvidenceJourney
          photos={reportPhotos}
          detectedObjects={dynamicScan.detectedObjects || []}
          spatialFindings={activeSpatialFindings}
          hazards={activeHazards}
          recommendations={dynamicScan.recommendations}
          evidenceReviews={activeEvidenceReviews}
          onOpenPhoto={handleOpenPhotoEvidence}
          onReviewPhoto={handleReviewPhotoFinding}
          onOpenActionPlan={handleOpenActionPlan}
        />

        <SpatialFindings
          findings={activeSpatialFindings}
          detectedObjects={dynamicScan.detectedObjects || []}
          evidenceReviews={activeEvidenceReviews}
          photos={reportPhotos}
          selectedPhotoId={activePhoto?.id || ""}
          onSelectPhoto={handleSelectPhoto}
          selectedFindingId={selectedSpatialFindingId}
          onSelectFinding={handleSelectSpatialFinding}
          onReviewChange={handleSpatialReviewChange}
        />

        <KeyFindings
          hazards={activeHazards}
          recommendations={dynamicScan.recommendations}
          image={mainImage}
          photos={reportPhotos}
          spatialFindings={activeSpatialFindings}
          evidenceReviews={activeEvidenceReviews}
          selectedHazardId={selectedHazardId}
          onSelectHazard={handleSelectHazard}
          onSelectSpatialFinding={handleOpenSpatialFinding}
          onSelectObservations={handleSelectObservations}
          detectedObjects={dynamicScan.detectedObjects}
          onFeedbackChange={handleFeedbackChange}
        />

        <div id="images" className="scroll-mt-24 space-y-10">
          <span className="field-tag text-muted-foreground block">Interactive Image & Bounding Boxes</span>
          <InteractiveImage
            image={activePhoto?.image || mainImage}
            photoId={activePhoto?.id}
            photos={reportPhotos}
            onSelectPhoto={handleSelectPhoto}
            hazards={activeHazards.filter((h) => h.feedback !== "not_present")}
            detectedObjects={dynamicScan.detectedObjects}
            spatialFindings={activeSpatialFindings}
            selectedHazardId={selectedHazardId}
            onSelectHazard={handleSelectHazard}
            selectedObservationIds={selectedObservationIds}
            selectedSpatialFindingId={selectedSpatialFindingId}
            onSelectSpatialFinding={setSelectedSpatialFindingId}
          />

          <div className="grid md:grid-cols-2 gap-10 pt-4">
            <div>
              <span className="field-tag text-muted-foreground block mb-4">Improvement Visualization</span>
              <BeforeAfterPreview
                originalImage={activePhoto?.image || mainImage}
                recommendations={photoScoped(dynamicScan.recommendations)}
                hazards={photoScoped(activeHazards)}
                detectedObjects={photoScoped(dynamicScan.detectedObjects || [])}
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
          homeId={dynamicScan.homeId}
          roomId={dynamicScan.roomId}
          photos={reportPhotos}
          hazards={activeHazards}
          detectedObjects={dynamicScan.detectedObjects || []}
          spatialFindings={activeSpatialFindings}
          onSelectPhoto={handleSelectPhoto}
          onSelectHazard={handleSelectHazard}
          onSelectSpatialFinding={handleOpenSpatialFinding}
          onSelectObservations={handleSelectObservations}
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
