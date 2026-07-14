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
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight mb-2 text-foreground">Assessments</h1>
          <p className="text-muted-foreground text-sm">Technical inspection reports and environmental audits.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reports..." 
              className="pl-9 h-10 rounded-lg bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-ring shadow-sm text-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
            className={`h-10 px-4 rounded-lg border flex items-center gap-2 transition-colors ${filterSeverity === 'high' ? 'bg-foreground text-background border-transparent shadow-sm' : 'bg-background text-foreground hover:bg-muted/30 border-border/50'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">Critical Only</span>
          </button>
        </div>
      </div>

      {enrichedReports.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-16 text-center border border-border/50 shadow-sm"
        >
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium tracking-tight mb-2 text-foreground">No assessments found</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Complete a scan to generate a technical inspection report of your environment.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate(`/properties/${report.homeId}/rooms/${report.roomId}/assessments/${report.id}`)}
              className="group cursor-pointer bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:border-border transition-colors flex flex-col md:flex-row items-start md:items-center gap-6"
            >
               <div className="w-full md:w-40 h-28 bg-muted/30 rounded-lg overflow-hidden shrink-0 relative border border-border/50">
                  {(report as any).images?.[0] || (report as any).originalImage ? (
                    <img src={(report as any).images?.[0] || (report as any).originalImage} className="w-full h-full object-cover grayscale-[0.8] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                  {report.status !== 'Completed' && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                       <span className="text-foreground text-[10px] font-medium uppercase tracking-widest">Processing</span>
                    </div>
                  )}
               </div>

               <div className="flex-1 min-w-0 w-full space-y-3">
                 <div>
                   <div className="flex items-center gap-2 mb-1.5">
                     <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">{report.homeName}</span>
                     <span className="w-1 h-1 rounded-full bg-border" />
                     <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">{report.roomName}</span>
                   </div>
                   <h3 className="text-lg font-medium tracking-tight text-foreground">Environmental Audit</h3>
                 </div>

                 <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {report.status === 'Completed' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">{report.hazards.length} Total Findings</span>
                        </div>
                        {report.highCount > 0 && (
                          <div className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                            <Activity className="w-3 h-3" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">{report.highCount} Critical</span>
                          </div>
                        )}
                      </>
                    )}
                 </div>
               </div>

               <div className="flex items-center gap-3 self-stretch md:self-auto ml-auto">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setReportToDelete(report);
                   }}
                   className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                   title="Delete Assessment"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
                 <div className="hidden md:flex w-8 h-8 rounded-lg bg-transparent border border-border/50 items-center justify-center shrink-0 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-colors">
                   <ArrowRight className="w-4 h-4" />
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
              className="relative bg-card border border-border/50 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-medium tracking-tight text-foreground">Delete Assessment?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Are you sure you want to delete this environmental audit report for <strong className="text-foreground font-medium">{reportToDelete.roomName}</strong> at <strong className="text-foreground font-medium">{reportToDelete.homeName}</strong>? This will permanently remove all findings, recommendations, and analytics.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" className="rounded-lg h-9 text-xs font-medium" onClick={() => setReportToDelete(null)}>Cancel</Button>
                <Button variant="destructive" className="rounded-lg h-9 text-xs font-medium px-4" onClick={handleDeleteConfirm}>Delete Permanently</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
