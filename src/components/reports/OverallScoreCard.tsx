import { Card } from '@/components/ui/card';
import { ScanResult } from '@/types/ai';
import { motion } from 'motion/react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

interface OverallScoreCardProps {
  scan: ScanResult;
}

export function OverallScoreCard({ scan }: OverallScoreCardProps) {
  const scoreColor = 
    scan.safetyScore >= 80 ? 'text-emerald-500' :
    scan.safetyScore >= 60 ? 'text-blue-500' :
    scan.safetyScore >= 40 ? 'text-amber-500' : 'text-red-500';

  const scoreGradient = 
    scan.safetyScore >= 80 ? 'from-emerald-500 to-emerald-400' :
    scan.safetyScore >= 60 ? 'from-blue-500 to-blue-400' :
    scan.safetyScore >= 40 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400';

  const ratingText = 
    scan.safetyScore >= 80 ? 'Excellent' :
    scan.safetyScore >= 60 ? 'Good' :
    scan.safetyScore >= 40 ? 'Needs Attention' : 'Critical';

  return (
    <Card className="flex flex-col md:flex-row items-center justify-between p-8 border-border/60 shadow-md relative overflow-hidden bg-card">
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${scoreGradient}`} />
      
      <div className="flex-1 mb-6 md:mb-0 md:pr-8">
        <h3 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-2">Overall Safety Score</h3>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold">{ratingText}</span>
          <span className="flex items-center text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="h-3 w-3 mr-1" />
            +4 pts from last scan
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          This room generally maintains safe clearances, but presents specific, manageable risks primarily related to fall prevention and missing safety equipment.
        </p>
      </div>

      <div className="relative h-48 w-48 shrink-0 flex items-center justify-center">
        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-muted stroke-current"
            strokeWidth="6"
            cx="50"
            cy="50"
            r="44"
            fill="transparent"
          />
          <motion.circle
            className={`${scoreColor} stroke-current`}
            strokeWidth="6"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="44"
            fill="transparent"
            initial={{ strokeDasharray: "0 276.46" }}
            animate={{ strokeDasharray: `${(scan.safetyScore / 100) * 276.46} 276.46` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-6xl font-bold tracking-tighter ${scoreColor}`}>
            {scan.safetyScore}
          </span>
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">out of 100</span>
        </div>
      </div>
    </Card>
  );
}
