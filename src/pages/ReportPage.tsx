import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useScanStore } from '@/stores/scanStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { ReportHeader } from '@/components/reports/ReportHeader';
import { OverallScoreCard } from '@/components/reports/OverallScoreCard';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown';
import { HazardList } from '@/components/reports/HazardList';
import { RecommendationList } from '@/components/reports/RecommendationList';
import { AiAnalysisSummary } from '@/components/reports/AiAnalysisSummary';
import { SafetySimulator } from '@/components/reports/SafetySimulator';
import { BeforeAfterPreview } from '@/components/reports/BeforeAfterPreview';
import { ReportAnalytics } from '@/components/reports/ReportAnalytics';
import { ExportCenter } from '@/components/reports/ExportCenter';
import { AccessibilitySummary } from '@/components/reports/AccessibilitySummary';
import { AiConfidencePanel } from '@/components/reports/AiConfidencePanel';
import { ReportFooter } from '@/components/reports/ReportFooter';
import { InteractiveImage } from '@/components/reports/InteractiveImage';
import { ReportTimeline } from '@/components/reports/ReportTimeline';

export function ReportPage() {
  const { homeId, roomId, reportId } = useParams();
  const { getScanById, loading: scanLoading } = useScanStore();
  const { homes, loading: homeLoading } = useHomeStore();
  
  const scan = getScanById(reportId || "");
  const currentHome = homes.find(h => h.id === homeId);
  const currentRoom = currentHome?.rooms.find(r => r.id === roomId);

  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);

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
        <h2 className="text-2xl font-bold tracking-tight">Report Not Found</h2>
        <p className="text-muted-foreground mt-2">The safety analysis report could not be located.</p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to={`/homes/${homeId}/rooms/${roomId}`}>Back to Room</Link>
        </Button>
      </div>
    );
  }

  const mainImage = scan.images[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <ReportHeader 
        scan={scan} 
        homeName={currentHome?.name} 
        roomName={currentRoom?.name} 
        homeId={homeId || ''} 
        roomId={roomId || ''} 
      />

      <OverallScoreCard scan={scan} />

      <CategoryBreakdown subScores={scan.subScores} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Overlay & Timeline */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <InteractiveImage 
            image={mainImage}
            hazards={scan.hazards}
            detectedObjects={scan.detectedObjects}
            selectedHazardId={selectedHazardId}
            onSelectHazard={setSelectedHazardId}
          />
          <section>
            <h2 className="text-xl font-semibold tracking-tight mb-4">AI Visualization</h2>
            <BeforeAfterPreview originalImage={mainImage} recommendations={scan.recommendations} hazards={scan.hazards} />
          </section>
          <section>
            <h2 className="text-xl font-semibold tracking-tight mb-4">Accessibility Grade</h2>
            <AccessibilitySummary score={scan.subScores?.accessibility} />
          </section>
          <ReportTimeline scan={scan} />
          <AiConfidencePanel confidence={scan.roomConfidence} />
          <ExportCenter scan={scan} homeName={currentHome?.name} roomName={currentRoom?.name} />
        </div>

        {/* Right Column: Hazards and Recommendations */}
        <div className="lg:col-span-7 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-5">Detected Hazards</h2>
            <HazardList 
              hazards={scan.hazards} 
              selectedHazardId={selectedHazardId} 
              onSelectHazard={setSelectedHazardId} 
            />
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-5">Action Plan</h2>
            <RecommendationList recommendations={scan.recommendations} />
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-5">AI Insights</h2>
            <AiAnalysisSummary />
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-5">Safety Simulator</h2>
            <SafetySimulator baseScore={scan.safetyScore} baseSubScores={scan.subScores} />
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight mb-5">Analytics</h2>
            <ReportAnalytics hazards={scan.hazards} subScores={scan.subScores} />
          </section>

        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
