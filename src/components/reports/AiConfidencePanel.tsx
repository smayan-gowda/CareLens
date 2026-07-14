import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AiConfidencePanelProps {
  confidence?: number;
}

export function AiConfidencePanel({ confidence = 88 }: AiConfidencePanelProps) {
  return (
    <Card className="border-border/60 shadow-sm bg-muted/10 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Model Confidence
              </h3>
              <p className="text-xs text-muted-foreground mt-1">CareLens Vision v2.4</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{confidence}%</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Image Quality</span>
                <span className="font-medium">Good (92%)</span>
              </div>
              <Progress value={92} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Room Coverage</span>
                <span className="font-medium text-amber-500">Partial (65%)</span>
              </div>
              <Progress value={65} className="h-1.5" />
            </div>
          </div>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            The AI detected significant occlusion behind the main furniture. We recommend capturing an additional photo from the opposite corner for a complete assessment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
