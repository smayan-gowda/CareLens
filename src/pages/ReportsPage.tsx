import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useScanStore } from '@/stores/scanStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileText, 
  ArrowRight, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Search, 
  Target,
  Filter,
  Trash2,
  Download,
  Share2,
  MoreVertical,
  X
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'motion/react';

export function ReportsPage() {
  const { scans, deleteScan, hiddenScans } = useScanStore();
  const { homes, hiddenHomes, hiddenRooms } = useHomeStore();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [reportToDelete, setReportToDelete] = useState<{ homeId: string, roomId: string, scanId: string } | null>(null);

  // Flatten all scans into a single array for the list
  const allScans = useMemo(() => {
    return Object.values(scans)
      .flat()
      .filter(scan => 
        !hiddenScans.includes(scan.id) && 
        !hiddenHomes.includes(scan.homeId) && 
        !hiddenRooms.includes(scan.roomId)
      );
  }, [scans, hiddenScans, hiddenHomes, hiddenRooms]);

  const handleDelete = (homeId: string, roomId: string, scanId: string) => {
    setReportToDelete({ homeId, roomId, scanId });
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportToDelete) return;
    try {
      await deleteScan(reportToDelete.roomId, reportToDelete.scanId);
      setReportToDelete(null);
      toast.success('Report deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      toast.error(`Failed to delete report: ${err?.message || err}`);
    }
  };

  const handleDownloadPDF = (scanId: string) => {
    toast.info('Preparing report download...');
    const scan = allScans.find(s => s.id === scanId);
    if (!scan) return;
    const { homeName, roomName } = getHomeAndRoomName(scan.homeId, scan.roomId);
    
    const content = `Safety Report for ${homeName} - ${roomName}
Date: ${new Date(scan.createdAt).toLocaleDateString()}
Safety Score: ${scan.safetyScore}/100

Hazards:
${scan.hazards.map(h => `- ${h.title}: ${h.description} (Severity: ${h.severity})`).join('\n')}

Recommendations:
${scan.recommendations.map(r => `- ${r}`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-report-${roomName}-${new Date(scan.createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  const handlePrint = (scanId: string) => {
    window.print();
  };

  const handleEmailCaregiver = (scanId: string) => {
    const scan = allScans.find(s => s.id === scanId);
    if (!scan) return;
    const { homeName, roomName } = getHomeAndRoomName(scan.homeId, scan.roomId);
    const subject = encodeURIComponent(`Safety Report: ${homeName} - ${roomName}`);
    const body = encodeURIComponent(`Please review the safety report for ${homeName} - ${roomName}.\n\nSafety Score: ${scan.safetyScore}/100\n\nYou can view the full report by logging into the CareLens AI application.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Opened email client');
  };

  const handleCopyLink = (scanId: string) => {
    const url = window.location.href + '/' + scanId;
    navigator.clipboard.writeText(url);
    toast.success('Report link copied to clipboard');
  };

  const filteredScans = useMemo(() => {
    return allScans.filter(scan => {
      const home = homes.find(h => h.id === scan.homeId);
      const room = home?.rooms.find(r => r.id === scan.roomId);
      const roomName = room?.name || 'Unknown Room';
      
      const matchesSearch = roomName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           scan.roomType?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRoom = roomFilter === 'all' || scan.roomType?.toLowerCase() === roomFilter.toLowerCase();
      
      const getRiskLevel = (score: number) => {
        if (score >= 80) return 'low';
        if (score >= 60) return 'medium';
        return 'high';
      };
      const matchesRisk = riskFilter === 'all' || getRiskLevel(scan.safetyScore) === riskFilter;
      
      return matchesSearch && matchesRoom && matchesRisk;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allScans, searchQuery, roomFilter, riskFilter, homes]);

  const getHomeAndRoomName = (homeId: string, roomId: string) => {
    const home = homes.find(h => h.id === homeId);
    const room = home?.rooms.find(r => r.id === roomId);
    return {
      homeName: home?.name || 'Unknown Home',
      roomName: room?.name || 'Unknown Room'
    };
  };

  const getScoreInfo = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-500', label: 'Safe', bg: 'bg-emerald-500/10' };
    if (score >= 60) return { color: 'text-blue-500', label: 'Needs Attention', bg: 'bg-blue-500/10' };
    if (score >= 40) return { color: 'text-amber-500', label: 'Medium Risk', bg: 'bg-amber-500/10' };
    return { color: 'text-red-500', label: 'High Risk', bg: 'bg-red-500/10' };
  };

  const roomTypes = Array.from(new Set(allScans.map(s => s.roomType).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safety Reports Center</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Access and manage all AI-generated safety analysis reports for your homes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/scan">
              <Search className="mr-2 h-4 w-4" /> New AI Scan
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" /> TOTAL REPORTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tracking-tight">{allScans.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> AVG. SAFETY SCORE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tracking-tight">
              {allScans.length > 0 
                ? Math.round(allScans.reduce((acc, scan) => acc + scan.safetyScore, 0) / allScans.length)
                : 0}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> TOTAL HAZARDS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tracking-tight">
              {allScans.reduce((acc, scan) => acc + scan.hazards.length, 0)}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Filter and view detailed AI analysis reports.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search reports..." 
                  className="pl-9 h-9 bg-background" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="h-9 w-[130px] bg-background">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {roomTypes.map(type => (
                    <SelectItem key={type} value={type || 'unknown'}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-9 w-[130px] bg-background">
                  <SelectValue placeholder="All Risks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || roomFilter !== 'all' || riskFilter !== 'all') && (
                <Button variant="ghost" size="sm" className="h-9" onClick={() => {
                  setSearchQuery('');
                  setRoomFilter('all');
                  setRiskFilter('all');
                }}>
                  <X className="h-4 w-4 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredScans.length === 0 ? (
             <div className="text-center py-24 px-4 bg-muted/5">
               <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 border border-dashed border-border/60">
                 <FileText className="h-8 w-8 text-muted-foreground/50" />
               </div>
               <h3 className="text-lg font-bold">No matching reports</h3>
               <p className="text-muted-foreground max-w-sm mx-auto mt-1 mb-6 text-sm">
                 We couldn't find any reports matching your current search or filter criteria.
               </p>
               <Button variant="outline" onClick={() => { setSearchQuery(''); setRoomFilter('all'); setRiskFilter('all'); }}>
                 Clear all filters
               </Button>
             </div>
          ) : (
            <div className="divide-y divide-border/40">
              <AnimatePresence>
                {filteredScans.map((scan, index) => {
                  const { homeName, roomName } = getHomeAndRoomName(scan.homeId, scan.roomId);
                  const scoreInfo = getScoreInfo(scan.safetyScore);
                  
                  return (
                    <motion.div 
                      key={scan.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/homes/${scan.homeId}/rooms/${scan.roomId}/reports/${scan.id}`)}
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-xl bg-muted border border-border/60 overflow-hidden flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all shadow-sm">
                          {scan.images[0] ? (
                            <img src={scan.images[0]} alt="Room preview" className="w-full h-full object-cover" />
                          ) : (
                            <Eye className="h-6 w-6 text-muted-foreground/50" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{roomName}</h3>
                            <Badge variant="outline" className={`${scoreInfo.bg} ${scoreInfo.color} border-none font-bold text-[10px] uppercase tracking-wider`}>
                              {scoreInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                            <Target className="h-3 w-3" /> {homeName} • {scan.roomType}
                          </p>
                          
                          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                              <Calendar className="h-3 w-3" /> {new Date(scan.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                              <AlertTriangle className="h-3 w-3" /> {scan.hazards.length} Hazards
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0 flex items-center gap-8 self-start md:self-auto ml-21 md:ml-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Safety Score</span>
                          <span className={`text-4xl font-black tracking-tighter leading-none ${scoreInfo.color}`}>
                            {scan.safetyScore}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100 hidden md:flex">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDownloadPDF(scan.id); }}>
                                  <Download className="h-4 w-4" /> Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrint(scan.id); }}>
                                  <FileText className="h-4 w-4" /> Print Report
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEmailCaregiver(scan.id); }}>
                                  <Share2 className="h-4 w-4" /> Email Caregiver
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleCopyLink(scan.id); }}>
                                  <Share2 className="h-4 w-4" /> Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(scan.homeId, scan.roomId, scan.id); }}>
                                  <Trash2 className="h-4 w-4" /> Delete Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Delete Safety Report?</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Are you sure you want to delete this safety report? This will permanently remove the AI scan results, detected hazards, and recommendations from the database. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setReportToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDeleteReport}>
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
