import { SubScores } from '@/types/ai';
import { motion } from 'motion/react';
import { ShieldAlert, Accessibility, Lightbulb, Flame, ListTree, Activity } from 'lucide-react';

interface CategoryBreakdownProps {
  subScores?: SubScores;
}

export function CategoryBreakdown({ subScores }: CategoryBreakdownProps) {
  if (!subScores) return null;

  const categories = [
    { name: 'Fall Prevention', score: subScores.fallPrevention, icon: ShieldAlert },
    { name: 'Accessibility', score: subScores.accessibility, icon: Accessibility },
    { name: 'Lighting', score: subScores.lighting, icon: Lightbulb },
    { name: 'Fire Safety', score: subScores.fireSafety, icon: Flame },
    { name: 'Organization', score: subScores.organization, icon: ListTree },
    { name: 'Mobility', score: subScores.mobility, icon: Activity },
  ];

  const barColor = (score: number) => (score >= 85 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive');
  const textColor = (score: number) => (score >= 85 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
      {categories.map((cat, i) => (
        <div key={cat.name} className="bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <cat.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
            <span className={`tabular text-xl font-semibold tracking-tight ${textColor(cat.score)}`}>{cat.score}</span>
          </div>
          <h4 className="field-tag text-muted-foreground mb-3">{cat.name}</h4>
          <div className="h-1 w-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full ${barColor(cat.score)}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${cat.score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
