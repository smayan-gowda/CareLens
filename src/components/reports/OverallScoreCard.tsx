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
    <Card className="flex flex-col md:flex-row items-center justify-between p-10 border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[2.5rem] relative overflow-hidden bg-card">
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${scoreGradient}`} />
      
      <div className="flex-1 mb-8 md:mb-0 md:pr-10">
        <h3 className="text-xs font-medium text-muted-foreground tracking-widest uppercase mb-4">Overall Safety Score</h3>
        <div className="flex items-baseline gap-4 mb-3">
          <span className="text-4xl font-medium tracking-tight">{ratingText}</span>
          <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
            <TrendingUp className="h-3 w-3 mr-1.5" />
            +4 pts from last scan
          </span>
        </div>
        <p className="text-muted-foreground text-base leading-relaxed max-w-md font-light">
          This room generally maintains safe clearances, but presents specific, manageable risks primarily related to fall prevention and missing safety equipment.
        </p>
      </div>

      <div className="relative h-48 w-48 shrink-0 flex items-center justify-center">
        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-muted/30 stroke-current"
            strokeWidth="4"
            cx="50"
            cy="50"
            r="46"
            fill="transparent"
          />
          <motion.circle
            className={`${scoreColor} stroke-current`}
            strokeWidth="4"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="46"
            fill="transparent"
            initial={{ strokeDasharray: "0 289.02" }}
            animate={{ strokeDasharray: `${(scan.safetyScore / 100) * 289.02} 289.02` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-6xl font-medium tracking-tighter ${scoreColor}`}>
            {scan.safetyScore}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">out of 100</span>
        </div>
      </div>
    </Card>
  );
}
