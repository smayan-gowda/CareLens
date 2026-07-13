import { Card, CardContent } from '@/components/ui/card';
import { SubScores } from '@/types/ai';
import { motion } from 'motion/react';
import { ShieldAlert, Accessibility, Lightbulb, Flame, ListTree, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CategoryBreakdownProps {
  subScores?: SubScores;
}

export function CategoryBreakdown({ subScores }: CategoryBreakdownProps) {
  if (!subScores) return null;

  const categories = [
    { name: 'Fall Prevention', score: subScores.fallPrevention, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Accessibility', score: subScores.accessibility, icon: Accessibility, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Lighting', score: subScores.lighting, icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Fire Safety', score: subScores.fireSafety, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Organization', score: subScores.organization, icon: ListTree, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Mobility', score: subScores.mobility, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((cat, i) => (
        <Card key={cat.name} className="overflow-hidden border-border/60 hover:border-primary/30 transition-colors shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${cat.bg}`}>
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
              </div>
              <span className={`text-xl font-bold ${cat.score < 60 ? 'text-amber-500' : 'text-foreground'}`}>
                {cat.score}
              </span>
            </div>
            
            <h4 className="font-semibold text-sm mb-3">{cat.name}</h4>
            
            <div className="space-y-1.5">
              <Progress value={cat.score} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>Critical</span>
                <span>Excellent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
