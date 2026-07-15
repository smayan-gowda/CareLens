import { useState, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);

  if (homesLoading || scansLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12 pt-6">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[2.5rem] overflow-hidden bg-black shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/10"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
           {(primaryHome as any)?.coverImage ? (
             <>
               <motion.img 
                 style={{ y: y1 }}
                 src={(primaryHome as any).coverImage} 
                 alt="Home" 
                 className="w-full h-[140%] object-cover object-center origin-top transform scale-105" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
             </>
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-black" />
           )}
        </div>
        
        <div className="relative z-10 flex flex-col justify-end p-8 md:p-14 min-h-[440px]">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
              {primaryHome ? primaryHome.name : "Your Home"}
            </h1>
            <p className="text-lg md:text-xl text-white/60 font-light tracking-wide">
              Continuous environmental monitoring and safety analysis.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/scan')}
              className="rounded-full bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm px-8 h-14 font-medium shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              <Camera className="mr-2 w-4 h-4" /> Run Assessment
            </Button>
            {primaryHome && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate(`/properties/${primaryHome.id}`)}
                className="rounded-full bg-white/5 hover:bg-white/10 text-white border-white/10 backdrop-blur-xl transition-all text-sm px-8 h-14 font-medium"
              >
                Property Details
              </Button>
            )}
          </div>
        </div>
        
        {/* Score Pill */}
        {activeReports.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="absolute top-8 right-8 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col items-end gap-1 shadow-2xl"
          >
             <div className="text-white/50 font-medium text-xs tracking-widest uppercase">Safety Index</div>
             <div className={`text-5xl md:text-6xl font-medium tracking-tighter ${getScoreColor(safetyScore)} drop-shadow-lg`}>{safetyScore}</div>
          </motion.div>
        )}
      </motion.section>

      {/* Grid Content */}
      <div className="grid md:grid-cols-12 gap-8 md:gap-12">
        
        {/* Action Center */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-7 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-medium tracking-tight text-foreground">
              Action Required
            </h2>
            {highPriorityHazards.length > 0 && (
              <span className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                {highPriorityHazards.length} Critical
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {highPriorityHazards.slice(0, 4).map((hazard, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                key={idx} 
                className="group p-6 rounded-[2rem] bg-card hover:bg-muted/40 transition-colors border border-black/5 dark:border-white/5 cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)]"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-base tracking-tight">{hazard.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-light leading-relaxed">{hazard.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}

            {highPriorityHazards.length === 0 && (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center py-12 px-6 rounded-[2rem] bg-card border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-foreground font-medium text-lg tracking-tight">All clear</p>
                <p className="text-base text-muted-foreground mt-2 font-light max-w-xs">No critical hazards detected in your recent scans.</p>
              </div>
            )}
          </div>

          {highPriorityHazards.length > 0 && (
             <Button variant="ghost" className="w-fit mt-8 rounded-full font-medium text-muted-foreground hover:text-foreground text-sm px-6 h-12" onClick={() => navigate('/assessments')}>
               View all assessments <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
          )}
        </motion.section>

        {/* Quick Insights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-5 space-y-8 flex flex-col"
        >
          {/* Recent Scans */}
          <div className="flex-1">
            <h2 className="text-2xl font-medium tracking-tight text-foreground mb-8 px-2">
              Recent History
            </h2>
            
            <div className="space-y-4">
              {activeReports.slice(0, 4).map((report, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                  key={report.id} 
                  onClick={() => navigate(`/properties/${report.homeId}/rooms/${report.roomId}/assessments/${report.id}`)} 
                  className="flex items-center gap-5 cursor-pointer group p-4 rounded-[2rem] bg-card hover:bg-muted/40 transition-colors border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)]"
                >
                  <div className="w-14 h-14 rounded-[1.25rem] bg-muted flex items-center justify-center shrink-0 overflow-hidden relative border border-black/5 dark:border-white/5">
                     {(report as any).images?.[0] || (report as any).originalImage ? (
                        <img src={(report as any).images?.[0] || (report as any).originalImage} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                     ) : (
                        <Camera className="w-5 h-5 text-muted-foreground" />
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base text-foreground truncate tracking-tight">Safety Scan</p>
                    <p className="text-sm text-muted-foreground font-light mt-0.5">{format(new Date(report.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
              
              {activeReports.length === 0 && (
                <div className="py-12 px-6 rounded-[2rem] bg-card border border-black/5 dark:border-white/5 text-center text-base text-muted-foreground font-light shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  No recent history.
                </div>
              )}
            </div>
          </div>

          {/* Setup Callout */}
          {!primaryHome && (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-foreground text-background rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group cursor-pointer" 
              onClick={() => navigate('/properties/new')}
            >
               <div className="absolute -right-8 -top-8 p-8 transform group-hover:scale-110 transition-transform duration-500 opacity-5">
                 <ShieldCheck className="w-48 h-48" />
               </div>
               <h3 className="text-2xl font-medium tracking-tight mb-3 relative z-10">Setup Your Space</h3>
               <p className="text-background/70 text-base mb-8 max-w-[90%] font-light relative z-10 leading-relaxed">
                 Add your first property to begin monitoring environmental safety and creating care plans.
               </p>
               <div className="inline-flex items-center text-sm font-medium relative z-10 bg-background text-foreground px-6 py-3 rounded-full">
                 Get Started
               </div>
            </motion.div>
          )}
        </motion.section>

      </div>
    </div>
  );
}
