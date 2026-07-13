import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle2 } from 'lucide-react';
import { ScanResult } from '@/types/ai';
import { motion } from 'motion/react';

interface ReportTimelineProps {
  scan: ScanResult;
}

export function ReportTimeline({ scan }: ReportTimelineProps) {
  const steps = [
    { title: 'Image Processed', desc: 'Visual data extracted and normalized' },
    { title: 'Room Classified', desc: `Identified as ${scan.roomType} (${scan.roomConfidence}% confidence)` },
    { title: 'Objects Mapped', desc: `${scan.detectedObjects?.length || 0} relevant objects identified` },
    { title: 'Hazards Detected', desc: `${scan.hazards.length} potential risks mapped` },
    { title: 'Risk Assessment Complete', desc: `Generated ${scan.recommendations.length} safety recommendations` },
  ];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Analysis Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div 
              key={i} 
              className="flex gap-3 relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex flex-col items-center">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 z-10">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-[1px] h-full bg-border absolute top-5" />
                )}
              </div>
              <div className={i < steps.length - 1 ? "pb-4" : ""}>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
