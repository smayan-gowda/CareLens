import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accessibility, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SubScores } from '@/types/ai';

interface AccessibilitySummaryProps {
  score?: number;
}

export function AccessibilitySummary({ score = 75 }: AccessibilitySummaryProps) {
  const isGood = score >= 70;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-blue-500" />
            Accessibility Profile
          </CardTitle>
          <Badge variant={isGood ? 'default' : 'secondary'} className={isGood ? 'bg-blue-500 hover:bg-blue-600' : ''}>
            Grade: {isGood ? 'B+' : 'C'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-4">
            The environment presents moderate challenges for continuous wheelchair use, primarily due to furniture density and transition thresholds. Ambulatory assistance devices (walkers, canes) are generally well-supported.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Wheelchair Clearance</span>
              <span className="font-medium text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Marginal
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Trip Hazards</span>
              <span className="font-medium text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Present
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lighting Accessibility</span>
              <span className="font-medium text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Adequate
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
          <h4 className="text-sm font-semibold mb-2">AI Caregiver Notes</h4>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "If the primary resident relies on a walker, the immediate priority should be securing the loose rug near the entrance. The current layout does not require major structural changes for ambulatory mobility, but clearing secondary pathways will significantly reduce friction."
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
