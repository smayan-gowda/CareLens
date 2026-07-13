import { useState, useMemo } from "react";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Shield, 
  Zap, 
  ArrowUp, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

export function TimelinePage() {
  const { timelineEvents, homes, hiddenHomes } = useHomeStore();
  const { scans } = useScanStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHomeId, setSelectedHomeId] = useState<string>('all');

  // Gather all existing scan IDs to filter out orphaned timeline events
  const existingScanIds = useMemo(() => {
    return Object.values(scans).flatMap(roomScans => roomScans.map(s => s.id));
  }, [scans]);

  // Keep events that are for non-hidden homes AND whose linked scans (if any) still exist
  const visibleEvents = useMemo(() => {
    return timelineEvents
      .filter(event => !hiddenHomes.includes(event.homeId))
      .filter(event => {
        // If event contains a scanId, make sure the scan actually exists
        if (event.scanId && !existingScanIds.includes(event.scanId)) {
          return false;
        }
        // Fallback: check event's link url for report/scan ID
        if (event.link) {
          const match = event.link.match(/\/reports\/([^\/]+)/);
          if (match) {
            const extractedScanId = match[1];
            if (!existingScanIds.includes(extractedScanId)) {
              return false;
            }
          }
        }
        return true;
      });
  }, [timelineEvents, hiddenHomes, existingScanIds]);

  // Apply user-selected filters
  const filteredEvents = useMemo(() => {
    return visibleEvents.filter(event => {
      const matchesType = selectedType === 'all' || event.type === selectedType;
      const matchesHome = selectedHomeId === 'all' || event.homeId === selectedHomeId;
      return matchesType && matchesHome;
    });
  }, [visibleEvents, selectedType, selectedHomeId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'scan': return <Shield className="h-4 w-4 text-primary" />;
      case 'improvement': return <Zap className="h-4 w-4 text-emerald-500" />;
      case 'score_change': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'note': return <FileText className="h-4 w-4 text-amber-500" />;
      case 'recommendation': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBg = (type: string) => {
    switch (type) {
      case 'scan': return 'bg-primary/10 border-primary/20 text-primary';
      case 'improvement': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
      case 'score_change': return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
      case 'note': return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
      case 'recommendation': return 'bg-purple-500/10 border-purple-500/20 text-purple-600';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getHomeName = (homeId: string) => {
    return homes.find(h => h.id === homeId)?.name || 'Unknown Home';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safety Timeline</h1>
          <p className="text-muted-foreground mt-1">Track your home safety improvements and progress over time.</p>
        </div>
        <Button 
          variant={isFilterOpen ? "default" : "outline"} 
          className="shrink-0 transition-colors" 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Clock className="mr-2 h-4 w-4" /> 
          {isFilterOpen ? "Hide Filters" : "Filter History"}
        </Button>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="border border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center">
                  {/* Home Select Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by Home</span>
                    <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                      <SelectTrigger className="w-full bg-background border-border/60">
                        <SelectValue placeholder="All Homes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Homes</SelectItem>
                        {homes.map((h) => (
                          <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Event Type Pills Filter */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Type</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'all', label: 'All Events' },
                        { id: 'scan', label: 'Scans' },
                        { id: 'improvement', label: 'Improvements' },
                        { id: 'score_change', label: 'Score Changes' },
                        { id: 'note', label: 'Notes' },
                        { id: 'recommendation', label: 'Recommendations' },
                      ].map((t) => (
                        <Button
                          key={t.id}
                          variant={selectedType === t.id ? "default" : "outline"}
                          size="sm"
                          className="h-8 rounded-full text-xs font-medium px-4"
                          onClick={() => setSelectedType(t.id)}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset Buttons */}
                {(selectedType !== 'all' || selectedHomeId !== 'all') && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground hover:text-foreground h-auto p-0"
                      onClick={() => {
                        setSelectedType('all');
                        setSelectedHomeId('all');
                      }}
                    >
                      Clear active filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative space-y-8">
        {filteredEvents.map((event, index) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-card shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/40 group-hover:ring-1 group-hover:ring-primary/10">
              <div className="flex items-center justify-between mb-2">
                <time className="text-xs font-medium text-muted-foreground">
                  {format(new Date(event.timestamp), 'MMMM dd, yyyy')}
                </time>
                <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider ${getEventBg(event.type)} border-none`}>
                  {event.type.replace('_', ' ')}
                </Badge>
              </div>
              
              <h3 className="font-bold text-lg mb-1">{event.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
              
              {event.scoreChange && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border/40 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Safety Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{event.scoreChange.from}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-bold text-emerald-600">{event.scoreChange.to}</span>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-border mx-1" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Improvement</span>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                      <ArrowUp className="h-3 w-3" />
                      {event.scoreChange.to - event.scoreChange.from}%
                    </div>
                  </div>
                </div>
              )}

              {event.details && event.details.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {event.details.map((detail, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {getHomeName(event.homeId)}
                </span>
                {event.link && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
                    <Link to={event.link}>View Details</Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border/60">
            <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No safety history found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm mt-1">
              Try adjusting your active filter options to see more results.
            </p>
            {(selectedType !== 'all' || selectedHomeId !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => {
                  setSelectedType('all');
                  setSelectedHomeId('all');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
