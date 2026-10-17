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

 const categoryData = useMemo(() => {
 const counts: Record<string, number> = {};
 enrichedReports.forEach(r => {
 r.hazards.forEach(h => {
 counts[h.category] = (counts[h.category] || 0) + 1;
 });
 });
 return Object.keys(counts)
 .map(key => ({ name: key, count: counts[key] }))
 .sort((a, b) => b.count - a.count)
 .slice(0, 7);
 }, [enrichedReports]);

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
 <div className="space-y-12">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div>
 <p className="field-tag text-muted-foreground mb-3">Findings</p>
 <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Assessments</h1>
 </div>
 <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
 <div className="relative w-full md:w-64">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
 <Input
 placeholder="Search"
 className="pl-11 h-11"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <button
 onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
 className={`h-11 px-5 rounded-md border flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shrink-0 text-sm font-medium ${filterSeverity === 'high' ? 'bg-foreground text-background border-transparent' : 'bg-background border-border text-foreground hover:bg-muted/50'}`}
 >
 <Filter className="w-4 h-4" />
 Critical Only
 </button>
 </div>
 </div>

 <div className="grid lg:grid-cols-3 gap-10">
 <div className="lg:col-span-2">
 {enrichedReports.length === 0 ? (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
 className="border-t border-b border-border/70 py-20 text-center"
 >
 <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-5" strokeWidth={1.5} />
 <h2 className="text-2xl font-semibold tracking-tight mb-3">No assessments found</h2>
 <p className="text-muted-foreground max-w-sm mx-auto font-light leading-relaxed">
 Complete a scan to generate a technical inspection report of your environment.
 </p>
 </motion.div>
 ) : (
 <div className="border-t border-border/70">
 {filteredReports.map((report, index) => (
 <motion.div
 key={report.id}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-60px" }}
 transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
 onClick={() => navigate(`/properties/${report.homeId}/rooms/${report.roomId}/assessments/${report.id}`)}
 className="group cursor-pointer border-b border-border/70 py-7 flex flex-col md:flex-row items-start md:items-center gap-6"
 >
 <div className="w-full md:w-44 h-28 bg-muted rounded-sm overflow-hidden shrink-0 relative">
 {(report as any).images?.[0] || (report as any).originalImage ? (
 <img src={(report as any).images?.[0] || (report as any).originalImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <FileText className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
 </div>
 )}
 {report.status !== 'Completed' && (
 <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center">
 <span className="text-foreground text-xs font-medium uppercase tracking-widest">Processing</span>
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0 w-full space-y-3">
 <div>
 <div className="flex items-center gap-2.5 mb-1.5 text-xs text-muted-foreground">
 <span>{report.homeName}</span>
 <span className="w-1 h-1 rounded-full bg-border" />
 <span>{report.roomName}</span>
 </div>
 <h3 className="text-2xl font-semibold tracking-tight group-hover:text-brand transition-colors">Environmental Audit</h3>
 </div>

 <div className="flex flex-wrap items-center gap-5 text-sm">
 <span className="flex items-center gap-2 text-muted-foreground font-light">
 <Calendar className="w-3.5 h-3.5" /> {format(new Date(report.createdAt), 'MMMM d, yyyy')}
 </span>
 {report.status === 'Completed' && (
 <>
 <span className="flex items-center gap-2 text-muted-foreground font-light">
 <ShieldCheck className="w-3.5 h-3.5" /> {report.hazards.length} findings
 </span>
 {report.highCount > 0 && (
 <span className="text-destructive font-medium text-xs uppercase tracking-wide">{report.highCount} Critical</span>
 )}
 </>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1 self-stretch md:self-auto ml-auto shrink-0">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setReportToDelete(report);
 }}
 className="p-2.5 text-muted-foreground/50 hover:text-destructive transition-colors"
 title="Delete Assessment"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors ml-2" />
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>

 <div className="lg:col-span-1">
 <div className="border border-border bg-card sticky top-24">
 <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
 <Activity className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
 <span className="field-tag text-muted-foreground">Top hazard categories</span>
 </div>
 <div className="p-5 space-y-4 min-h-[160px]">
 {categoryData.length > 0 ? categoryData.map((item, index) => {
 const maxCount = Math.max(...categoryData.map(d => d.count), 1);
 const percentage = (item.count / maxCount) * 100;
 return (
 <div key={item.name}>
 <div className="flex justify-between items-center text-sm mb-1.5">
 <span className="font-medium text-foreground/90 truncate max-w-[75%]">{item.name}</span>
 <span className="tabular text-muted-foreground text-xs">{item.count}</span>
 </div>
 <div className="h-1 w-full bg-muted overflow-hidden">
 <motion.div initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.06 }} className="h-full bg-brand" />
 </div>
 </div>
 );
 }) : (
 <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">No hazard data available</div>
 )}
 </div>
 </div>
 </div>
 </div>

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
 initial={{ opacity: 0, scale: 0.96, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.96, y: 10 }}
 transition={{ type: "spring", duration: 0.4 }}
 className="relative bg-card border border-border/70 rounded-md p-7 shadow-[var(--elevation-floating)] max-w-md w-full space-y-4"
 >
 <h3 className="text-xl font-semibold tracking-tight">Delete assessment?</h3>
 <p className="text-muted-foreground text-sm leading-relaxed font-light">
 This permanently removes the report for <strong className="text-foreground font-medium">{reportToDelete.roomName}</strong> at <strong className="text-foreground font-medium">{reportToDelete.homeName}</strong>, including all findings and recommendations.
 </p>
 <div className="flex justify-end gap-2 pt-2">
 <Button variant="ghost" onClick={() => setReportToDelete(null)}>Cancel</Button>
 <Button variant="destructive" onClick={handleDeleteConfirm}>Delete Permanently</Button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
