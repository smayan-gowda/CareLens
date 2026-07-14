import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Home as HomeIcon,
  Activity,
  Plus
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { format } from "date-fns";

export function DashboardPage() {
  const { homes, loading: homesLoading } = useHomeStore();
  const { scans, loading: scansLoading } = useScanStore();
  const navigate = useNavigate();

  const primaryHome = homes[0];
  
  const allScans = useMemo(() => {
    return Object.values(scans).flat();
  }, [scans]);

  const activeReports = useMemo(() => {
    return allScans.filter(r => r.status === 'Completed' && r.hazards.length > 0).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allScans]);
  
  const allHazards = useMemo(() => {
    return activeReports.flatMap(r => r.hazards);
  }, [activeReports]);

  const highPriorityHazards = allHazards.filter(h => h.severity === 'High' || h.severity === 'Critical');
  
  const safetyScore = useMemo(() => {
    if (activeReports.length === 0) return 100;
    const deductions = allHazards.reduce((acc, curr) => {
      if (curr.severity === 'Critical') return acc + 15;
      if (curr.severity === 'High') return acc + 10;
      if (curr.severity === 'Medium') return acc + 5;
      return acc + 2;
    }, 0);
    return Math.max(0, 100 - deductions);
  }, [activeReports, allHazards]);

  if (homesLoading || scansLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">Monitor environmental safety across your properties.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-full shadow-sm bg-background flex-1 md:flex-none h-10 border-border/60"
            onClick={() => navigate(primaryHome ? `/properties/${primaryHome.id}` : '/properties/new')}
          >
            <HomeIcon className="w-4 h-4 mr-2 text-muted-foreground" /> {primaryHome ? 'Manage Property' : 'Add Property'}
          </Button>
          <Button 
            className="rounded-full shadow-sm flex-1 md:flex-none h-10"
            onClick={() => navigate('/scan')}
          >
            <Camera className="w-4 h-4 mr-2" /> New Scan
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Metric Cards */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Hero Metric */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-[2rem] border border-border/50 shadow-sm overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="p-8 sm:p-10 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Safety Index</span>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-6xl md:text-7xl font-semibold tracking-tighter leading-none">{safetyScore}</span>
                <span className="text-2xl font-medium text-muted-foreground mb-1">/ 100</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4 max-w-sm">
                Based on {activeReports.length} recent assessments. Score deductions prioritize fall risks and critical accessibility barriers.
              </p>
            </div>
            
            <div className="bg-muted/30 p-8 sm:p-10 sm:w-[280px] border-t sm:border-t-0 sm:border-l border-border/50 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]"></div>
              <div className="relative z-10 space-y-6">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Critical Hazards</div>
                  <div className="text-2xl font-semibold">{highPriorityHazards.length}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Monitored</div>
                  <div className="text-2xl font-semibold">{allHazards.length}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Center */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-[2rem] p-8 border border-border/50 shadow-sm flex flex-col flex-1"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">Requires Attention</h2>
              {highPriorityHazards.length > 0 && (
                <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md text-xs font-medium">
                  {highPriorityHazards.length} Critical
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {highPriorityHazards.slice(0, 3).map((hazard, idx) => (
                <div key={idx} className="group p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-border/50 cursor-pointer flex items-start gap-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{hazard.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{hazard.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </div>
              ))}

              {highPriorityHazards.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border/50">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-sm">All clear</p>
                  <p className="text-sm text-muted-foreground mt-1">No critical hazards detected.</p>
                </div>
              )}
            </div>

            {highPriorityHazards.length > 0 && (
               <Button variant="ghost" className="w-full mt-4 rounded-xl font-medium text-muted-foreground hover:text-foreground text-sm" onClick={() => navigate('/assessments')}>
                 View all assessments <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            )}
          </motion.div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6 flex flex-col">
          {/* Setup Callout */}
          {!primaryHome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} 
              className="bg-foreground text-background rounded-[2rem] p-8 shadow-sm relative overflow-hidden group cursor-pointer" 
              onClick={() => navigate('/properties/new')}
            >
               <h3 className="text-lg font-semibold tracking-tight mb-2 relative z-10">Setup Space</h3>
               <p className="text-background/70 text-sm mb-6 max-w-[90%] relative z-10">
                 Add your first property to begin monitoring safety.
               </p>
               <div className="inline-flex items-center text-sm font-medium relative z-10">
                 Get Started <ArrowRight className="w-4 h-4 ml-2" />
               </div>
            </motion.div>
          )}

          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-[2rem] p-8 border border-border/50 shadow-sm flex-1 flex flex-col"
          >
            <h2 className="text-lg font-semibold tracking-tight mb-6">Recent Scans</h2>
            
            <div className="space-y-1 flex-1">
              {activeReports.slice(0, 5).map((report) => (
                <div key={report.id} onClick={() => navigate(`/properties/${report.homeId}/rooms/${report.roomId}/assessments/${report.id}`)} className="flex items-center gap-4 cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative border border-border/50">
                     {(report as any).images?.[0] || (report as any).originalImage ? (
                        <img src={(report as any).images?.[0] || (report as any).originalImage} className="w-full h-full object-cover" />
                     ) : (
                        <Camera className="w-4 h-4 text-muted-foreground" />
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Assessment</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(report.createdAt), "MMM d")}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
                </div>
              ))}
              
              {activeReports.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-10">
                  <Camera className="w-8 h-8 mb-3 opacity-20" />
                  No recent history.
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
