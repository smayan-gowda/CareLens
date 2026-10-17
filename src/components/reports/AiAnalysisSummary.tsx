import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, CheckCircle2 } from 'lucide-react';

export function AiAnalysisSummary() {
 const points = [
 "The walking path between the main furniture pieces appears narrower than the recommended 32 inches for mobility aid clearance.",
 "A loose floor mat was detected near a frequently used pathway, presenting a potential friction and trip risk.",
 "Ambient lighting levels appear lower near the room's entry points, which may obscure potential floor obstacles.",
 "No wall-mounted support structures (grab bars or handrails) were detected in transition areas.",
 "Emergency equipment (fire extinguisher, smoke detector) was not clearly visible in the analyzed frames."
 ];

 return (
 <Card className="border-border/60 shadow-sm bg-muted/20">
 <CardHeader className="pb-3 border-b border-border/50 bg-background/50">
 <CardTitle className="text-lg flex items-center gap-2">
 <BrainCircuit className="h-5 w-5 text-primary" />
 AI Analysis Summary
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 <p className="text-sm text-muted-foreground mb-4">
 The CareLens Vision model identified several environmental patterns that contribute to the current safety score. These conclusions are based on standard gerontology and home accessibility guidelines.
 </p>
 <div className="space-y-3">
 {points.map((point, i) => (
 <div key={i} className="flex gap-3 items-start">
 <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
 <p className="text-sm text-foreground/90 leading-relaxed">{point}</p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 );
}
