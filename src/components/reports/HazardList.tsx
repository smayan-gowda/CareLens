import { Hazard } from '@/types/ai';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Crosshair, Info, Check, ChevronDown, ChevronUp, Clock, DollarSign, Wrench } from 'lucide-react';
import { useState } from 'react';

interface HazardListProps {
  hazards: Hazard[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string | null) => void;
}

export function HazardList({ hazards, selectedHazardId, onSelectHazard }: HazardListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'border-red-500 bg-red-500/10 text-red-500';
      case 'High': return 'border-orange-500 bg-orange-500/10 text-orange-500';
      case 'Medium': return 'border-amber-500 bg-amber-500/10 text-amber-500';
      default: return 'border-blue-500 bg-blue-500/10 text-blue-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical': return <Badge variant="destructive">Critical Risk</Badge>;
      case 'High': return <Badge className="bg-orange-500 hover:bg-orange-600">High Risk</Badge>;
      case 'Medium': return <Badge className="bg-amber-500 hover:bg-amber-600">Medium Risk</Badge>;
      default: return <Badge className="bg-blue-500 hover:bg-blue-600">Low Risk</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {hazards.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-12 text-center">
            <Check className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hazards detected</h3>
            <p className="text-muted-foreground mt-1">This room appears well-configured for safety.</p>
          </CardContent>
        </Card>
      ) : (
        hazards.map(hazard => {
          const isExpanded = selectedHazardId === hazard.id;
          return (
            <motion.div 
              key={hazard.id}
              layout
              className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                isExpanded 
                  ? 'border-primary/50 shadow-md ring-1 ring-primary/20' 
                  : 'border-border/60 shadow-sm hover:border-primary/30'
              }`}
            >
              <div className="p-5 bg-card">
                <div 
                  className="flex justify-between items-start mb-3 cursor-pointer"
                  onClick={() => onSelectHazard(isExpanded ? null : hazard.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-full border shrink-0 mt-0.5 ${getSeverityColor(hazard.severity)}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{hazard.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">{hazard.category}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Crosshair className="h-3 w-3" /> {hazard.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                    {getSeverityBadge(hazard.severity)}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-foreground/90 mt-4 leading-relaxed">{hazard.description}</p>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-5 mt-5 border-t border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Location</span>
                              <span className="text-sm font-medium">{hazard.location}</span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Objects Involved</span>
                              <div className="flex flex-wrap gap-1.5">
                                {hazard.objectsInvolved?.length ? hazard.objectsInvolved.map((obj, i) => (
                                  <Badge key={i} variant="outline" className="bg-background">{obj}</Badge>
                                )) : <span className="text-sm text-muted-foreground">None specified</span>}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium uppercase">Est. Cost</span>
                                </div>
                                <span className="text-sm font-semibold">$50 - $150</span>
                              </div>
                              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                  <Wrench className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium uppercase">Difficulty</span>
                                </div>
                                <span className="text-sm font-semibold">Easy (DIY)</span>
                              </div>
                            </div>

                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex-1">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <Info className="h-3.5 w-3.5" /> Clinical Reasoning
                              </span>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {hazard.reasoning || hazard.impact}
                              </p>
                            </div>
                            
                            <div className="flex gap-2 mt-auto">
                              <Button variant="outline" size="sm" className="flex-1">Mark Resolved</Button>
                              <Button size="sm" className="flex-1">View Fix</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
