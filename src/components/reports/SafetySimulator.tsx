import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { motion } from 'motion/react';
import { Activity, Zap } from 'lucide-react';
import { SubScores } from '@/types/ai';

interface SafetySimulatorProps {
  baseScore: number;
  baseSubScores?: SubScores;
}

export function SafetySimulator({ baseScore, baseSubScores }: SafetySimulatorProps) {
  const [improvements, setImprovements] = useState([
    { id: 'grab_bars', label: 'Install Grab Bars', impact: 8, active: false },
    { id: 'lighting', label: 'Improve Lighting', impact: 5, active: false },
    { id: 'rugs', label: 'Remove Loose Rugs', impact: 12, active: false },
    { id: 'clear_paths', label: 'Clear Walkways', impact: 7, active: false },
  ]);

  const toggleImprovement = (id: string) => {
    setImprovements(prev => prev.map(imp => imp.id === id ? { ...imp, active: !imp.active } : imp));
  };

  const currentScore = Math.min(100, baseScore + improvements.filter(i => i.active).reduce((sum, i) => sum + i.impact, 0));
  
  const scoreColor = 
    currentScore >= 80 ? 'text-emerald-500' :
    currentScore >= 60 ? 'text-blue-500' :
    currentScore >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50 bg-background/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Safety Simulator
            </CardTitle>
            <CardDescription className="mt-1">Preview impact of recommendations</CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Projected Score</span>
            <motion.span 
              key={currentScore}
              initial={{ scale: 1.2, color: '#10b981' }}
              animate={{ scale: 1, color: 'inherit' }}
              className={`text-3xl font-bold ${scoreColor}`}
            >
              {currentScore}
            </motion.span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {improvements.map((imp) => (
            <div key={imp.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{imp.label}</span>
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                  <Zap className="h-3 w-3" /> +{imp.impact} pts
                </span>
              </div>
              <Switch 
                checked={imp.active} 
                onCheckedChange={() => toggleImprovement(imp.id)} 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
