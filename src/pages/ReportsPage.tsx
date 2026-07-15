import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useScanStore } from '@/stores/scanStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ArrowRight, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ReportsPage() {
  const navigate = useNavigate();
  const { scans, deleteScan } = useScanStore();
  const { homes } = useHomeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [reportToDelete, setReportToDelete] = useState<any>(null);

  const enrichedReports = useMemo(() => {
    const reports = Object.values(scans).flat();
    return reports.map(report => {
      const home = homes.find(h => h.id === report.homeId);
      const room = home?.rooms.find(r => r.id === report.roomId);
      return {
        ...report,
        homeName: home?.name || 'Unknown Property',
        roomName: room?.name || 'Unknown Zone',
        highCount: report.hazards.filter(h => h.severity === 'High' || h.severity === 'Critical').length,
        mediumCount: report.hazards.filter(h => h.severity === 'Medium').length,
        lowCount: report.hazards.filter(h => h.severity === 'Low').length,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [scans, homes]);

  const filteredReports = enrichedReports.filter(report => {
    const matchesSearch = 
      report.homeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.roomName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'high') return report.highCount > 0;
    if (filterSeverity === 'medium') return report.mediumCount > 0;
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    try {
      await deleteScan(reportToDelete.roomId, reportToDelete.id);
      toast.success("Assessment report deleted successfully");
    } catch (err) {
      toast.error("Failed to delete assessment");
    } finally {
      setReportToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-3">Assessments</h1>
          <p className="text-muted-foreground text-lg font-light">Technical inspection reports and environmental audits.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search reports..." 
              className="pl-12 h-14 rounded-[1.5rem] bg-card border-border focus-visible:ring-1 focus-visible:ring-foreground shadow-sm text-base transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
            className={`h-14 px-8 rounded-[1.5rem] border flex items-center justify-center gap-2 transition-all w-full sm:w-auto active:scale-95 shadow-sm ${filterSeverity === 'high' ? 'bg-foreground text-background border-transparent' : 'bg-card border-border text-foreground hover:bg-muted/50'}`}
          >
            <Filter className="w-5 h-5" />
            <span className="text-base font-medium">Critical Only</span>
          </button>
        </div>
      </div>

      {enrichedReports.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card rounded-[2.5rem] p-16 text-center border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
        >
          <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-medium tracking-tight mb-3">No assessments found</h2>
          <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-light leading-relaxed">
            Complete a scan to generate a technical inspection report of your environment.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate(`/properties/${report.homeId}/rooms/${report.roomId}/assessments/${report.id}`)}
              className="group cursor-pointer bg-card rounded-[2rem] p-6 border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-8 hover:-translate-y-1"
            >
               <div className="w-full md:w-56 h-36 bg-muted rounded-3xl overflow-hidden shrink-0 relative">
                  {(report as any).images?.[0] || (report as any).originalImage ? (
                    <img src={(report as any).images?.[0] || (report as any).originalImage} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {report.status !== 'Completed' && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center">
                       <span className="text-foreground text-xs font-medium uppercase tracking-widest">Processing</span>
                    </div>
                  )}
               </div>

               <div className="flex-1 min-w-0 w-full space-y-4">
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{report.homeName}</span>
                     <span className="w-1 h-1 rounded-full bg-border" />
                     <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{report.roomName}</span>
                   </div>
                   <h3 className="text-2xl font-medium tracking-tight transition-colors">Environmental Audit</h3>
                 </div>

                 <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{format(new Date(report.createdAt), 'MMMM d, yyyy')}</span>
                    </div>
                    {report.status === 'Completed' && (
                      <>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{report.hazards.length} Total Findings</span>
                        </div>
                        {report.highCount > 0 && (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wider uppercase">{report.highCount} Critical</span>
                          </div>
                        )}
                      </>
                    )}
                 </div>
               </div>

               <div className="flex items-center gap-2 self-stretch md:self-auto ml-auto">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setReportToDelete(report);
                   }}
                   className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all shrink-0"
                   title="Delete Assessment"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
                 <div className="hidden md:flex w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                   <ArrowRight className="w-5 h-5" />
                 </div>
               </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {reportToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4"
            >
              <h3 className="text-xl font-semibold tracking-tight">Delete Assessment?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                Are you sure you want to delete this environmental audit report for <strong className="text-foreground">{reportToDelete.roomName}</strong> at <strong className="text-foreground">{reportToDelete.homeName}</strong>? This will permanently remove all findings, recommendations, and analytics.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" className="rounded-full" onClick={() => setReportToDelete(null)}>Cancel</Button>
                <Button variant="destructive" className="rounded-full px-6" onClick={handleDeleteConfirm}>Delete Permanently</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
