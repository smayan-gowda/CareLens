import { Recommendation } from '@/types/ai';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, ArrowRight, Wrench, Clock, DollarSign, Target } from 'lucide-react';
import { useState } from 'react';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => {
        const isExpanded = expandedRecId === rec.id;
        
        // Use a staggered animation delay based on index
        return (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className={`border-border/60 shadow-sm overflow-hidden transition-colors ${isExpanded ? 'border-emerald-500/30' : 'hover:border-emerald-500/20'}`}>
              <div 
                className="p-5 bg-card hover:bg-muted/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4"
                onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
              >
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-full shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{rec.title}</h4>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-bold whitespace-nowrap self-start sm:self-auto">
                      +{rec.expectedImpact} pts impact
                    </Badge>
                  </div>
                  <p className={`text-sm text-muted-foreground ${!isExpanded ? 'line-clamp-1' : ''}`}>
                    {rec.description}
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-muted/10"
                  >
                    <div className="p-5 pt-0 border-t border-border/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
                        <div className="bg-background p-3 rounded-xl border border-border/60 flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Target className="h-3 w-3" /> Priority
                          </span>
                          <span className="text-sm font-semibold">{rec.priority}</span>
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border/60 flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <DollarSign className="h-3 w-3" /> Est. Cost
                          </span>
                          <span className="text-sm font-semibold">{rec.estimatedCost}</span>
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border/60 flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Wrench className="h-3 w-3" /> Execution
                          </span>
                          <span className="text-sm font-semibold">{rec.difficulty === 'Easy' ? 'DIY' : 'Professional'}</span>
                        </div>
                        <div className="bg-background p-3 rounded-xl border border-border/60 flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Clock className="h-3 w-3" /> Est. Time
                          </span>
                          <span className="text-sm font-semibold">2-4 hours</span>
                        </div>
                      </div>
                      
                      {rec.whyDetected && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm mb-5">
                          <strong className="font-semibold flex items-center gap-1.5 mb-2 text-emerald-700 dark:text-emerald-400">
                            <HelpCircle className="h-4 w-4" /> Why this is recommended
                          </strong>
                          <span className="text-foreground/80 leading-relaxed block">{rec.whyDetected}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Mark as Complete
                        </Button>
                        <Button variant="outline">
                          Save for Later
                        </Button>
                        <Button variant="ghost" className="ml-auto text-primary">
                          Find Local Pros <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
