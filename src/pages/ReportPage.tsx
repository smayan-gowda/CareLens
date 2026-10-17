import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useScanStore } from '@/stores/scanStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { ReportNav } from '@/components/reports/ReportNav';
import { ReportHero } from '@/components/reports/ReportHero';
import { OverallScoreCard } from '@/components/reports/OverallScoreCard';
import { ExecutiveSummary } from '@/components/reports/ExecutiveSummary';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown';
import { KeyFindings } from '@/components/reports/KeyFindings';
import { RecommendationBlocks } from '@/components/reports/RecommendationBlocks';
import { BeforeAfterPreview } from '@/components/reports/BeforeAfterPreview';
import { ReportAnalytics } from '@/components/reports/ReportAnalytics';
import { ExportCenter } from '@/components/reports/ExportCenter';
import { AccessibilitySummary } from '@/components/reports/AccessibilitySummary';
import { AiConfidencePanel } from '@/components/reports/AiConfidencePanel';
import { ReportFooter } from '@/components/reports/ReportFooter';
import { InteractiveImage } from '@/components/reports/InteractiveImage';
import { ReportTimelineSection } from '@/components/reports/ReportTimelineSection';

export function ReportPage() {
  const { homeId, roomId, reportId } = useParams();
  const { getScanById, getScansForRoom, loading: scanLoading } = useScanStore();
  const { homes, loading: homeLoading } = useHomeStore();

  const scan = getScanById(reportId || "");
  const currentHome = homes.find(h => h.id === homeId);
  const currentRoom = currentHome?.rooms.find(r => r.id === roomId);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);

  const roomScans = useMemo(() => getScansForRoom(roomId || ""), [getScansForRoom, roomId]);

  const previousScore = useMemo(() => {
    if (!scan) return undefined;
    const priorCompleted = roomScans
      .filter(s => s.status === 'Completed' && s.id !== scan.id && new Date(s.createdAt) < new Date(scan.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return priorCompleted[0]?.safetyScore;
  }, [roomScans, scan]);

  if (scanLoading || homeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-sm text-muted-foreground mt-4 font-medium">Preparing safety report...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-medium tracking-tight">Report Not Found</h2>
        <p className="text-muted-foreground mt-2">The safety analysis report could not be located.</p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to={`/properties/${homeId}/rooms/${roomId}`}>Back to Zone</Link>
        </Button>
      </div>
    );
  }

  const mainImage = scan.images?.[0] || (scan as any).originalImage;

  const oneLiner =
    scan.hazards.length === 0
      ? `Your ${(scan.roomType || 'room').toLowerCase()} is in great shape.`
      : scan.hazards.filter(h => h.severity === 'Critical' || h.severity === 'High').length > 0
      ? `Your ${(scan.roomType || 'room').toLowerCase()} is generally safe, with one improvement that would significantly reduce risk.`
      : `Your ${(scan.roomType || 'room').toLowerCase()} is in good shape, with a few small things worth a look.`;

  return (
    <div className="animate-in fade-in duration-500">
      <ReportNav />

      <ReportHero
        scan={scan}
        mainImage={mainImage}
        homeName={currentHome?.name}
        roomName={currentRoom?.name}
        homeId={homeId || ''}
        roomId={roomId || ''}
        oneLiner={oneLiner}
      />

      <div className="max-w-5xl mx-auto px-5 md:px-10 space-y-16 md:space-y-24 py-16 md:py-20">
        <OverallScoreCard scan={scan} previousScore={previousScore} />

        <ExecutiveSummary scan={scan} />

        <KeyFindings
          hazards={scan.hazards}
          recommendations={scan.recommendations}
          image={mainImage}
          selectedHazardId={selectedHazardId}
          onSelectHazard={setSelectedHazardId}
          detectedObjects={scan.detectedObjects}
        />

        <div id="images" className="scroll-mt-24 space-y-10">
          <span className="field-tag text-muted-foreground block">Interactive Image</span>
          <InteractiveImage
            image={mainImage}
            hazards={scan.hazards}
            detectedObjects={scan.detectedObjects}
            selectedHazardId={selectedHazardId}
            onSelectHazard={setSelectedHazardId}
          />

          <div className="grid md:grid-cols-2 gap-10 pt-4">
            <div>
              <span className="field-tag text-muted-foreground block mb-4">AI Visualization</span>
              <BeforeAfterPreview originalImage={mainImage} recommendations={scan.recommendations} hazards={scan.hazards} detectedObjects={scan.detectedObjects} />
            </div>
            <div>
              <span className="field-tag text-muted-foreground block mb-4">Accessibility Grade</span>
              <AccessibilitySummary score={scan.subScores?.accessibility} />
            </div>
          </div>

          <div>
            <span className="field-tag text-muted-foreground block mb-4">Category Breakdown</span>
            <CategoryBreakdown subScores={scan.subScores} />
          </div>
        </div>

        <RecommendationBlocks recommendations={scan.recommendations} currentScore={scan.safetyScore} scanId={scan.id} />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch pt-16 border-t border-border">
          <div className="space-y-10 lg:pt-0 flex flex-col h-full">
            <ReportTimelineSection
              currentScan={scan}
              roomScans={roomScans}
              homeId={homeId || ''}
              roomId={roomId || ''}
            />
            <AiConfidencePanel confidence={scan.roomConfidence} className="flex-1" />
          </div>

          <div className="space-y-10 lg:pt-0 flex flex-col h-full">
            <ReportAnalytics hazards={scan.hazards} subScores={scan.subScores} />
          </div>
        </div>

        <div>
          <ExportCenter scan={scan} homeName={currentHome?.name} roomName={currentRoom?.name} />
        </div>

        <ReportFooter />
      </div>
    </div>
  );
}
