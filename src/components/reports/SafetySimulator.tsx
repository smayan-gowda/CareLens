import { useState } from 'react';
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
    currentScore >= 80 ? 'text-success' :
    currentScore >= 60 ? 'text-brand' :
    currentScore >= 40 ? 'text-warning' : 'text-destructive';

  return (
    <div className="border border-border bg-card">
      <div className="flex justify-between items-center px-6 py-4 border-b border-border">
        <div>
          <span className="font-semibold tracking-tight text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} /> Safety Simulator
          </span>
          <p className="text-xs text-muted-foreground mt-1">Preview impact of recommendations</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="field-tag text-muted-foreground mb-1">Projected</span>
          <motion.span key={currentScore} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className={`tabular text-3xl font-semibold tracking-tight ${scoreColor}`}>
            {currentScore}
          </motion.span>
        </div>
      </div>
      <div className="p-6">
        {improvements.map((imp) => (
          <div key={imp.id} className="flex items-center justify-between py-3.5 border-b border-border last:border-b-0">
            <div className="flex flex-col">
              <span className="font-medium text-sm">{imp.label}</span>
              <span className="text-xs text-success font-medium flex items-center gap-1 mt-0.5">
                <Zap className="h-3 w-3" /> +{imp.impact} pts
              </span>
            </div>
            <Switch checked={imp.active} onCheckedChange={() => toggleImprovement(imp.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
