import { useState, useMemo } from "react";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { 
  Activity, 
  Shield, 
  Zap, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  FileText,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TimelinePage() {
  const { timelineEvents, homes, hiddenHomes } = useHomeStore();
  const { scans } = useScanStore();
  const [selectedHomeId, setSelectedHomeId] = useState<string>('all');

  const visibleHomes = homes.filter(h => !hiddenHomes.includes(h.id));

  const existingScanIds = useMemo(() => {
    return Object.values(scans).flatMap(roomScans => roomScans.map(s => s.id));
  }, [scans]);

  const sortedEvents = useMemo(() => {
    return timelineEvents
      .filter(event => !hiddenHomes.includes(event.homeId))
      .filter(event => {
        if (event.type === 'scan' && event.scanId) {
          return existingScanIds.includes(event.scanId);
        }
        return true;
      })
      .filter(event => selectedHomeId === 'all' || event.homeId === selectedHomeId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [timelineEvents, hiddenHomes, existingScanIds, selectedHomeId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'scan': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'hazard_resolved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'report': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <Clock className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getEventBackground = (type: string) => {
    switch (type) {
      case 'scan': return 'bg-blue-50 dark:bg-blue-500/10';
      case 'hazard_resolved': return 'bg-emerald-50 dark:bg-emerald-500/10';
      case 'report': return 'bg-purple-50 dark:bg-purple-500/10';
      default: return 'bg-neutral-50 dark:bg-neutral-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">Progress History</h1>
          <p className="text-neutral-500 text-lg font-light max-w-xl">Track environmental assessments, resolved hazards, and safety improvements over time.</p>
        </div>
        
        <div className="w-full md:w-64">
           <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
             <SelectTrigger className="h-12 w-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-full focus:ring-black dark:focus:ring-white">
               <div className="flex items-center gap-2 flex-1 text-left truncate">
                 <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
                 <span className="truncate">
                   {selectedHomeId === "all" ? "All Properties" : (visibleHomes.find(h => h.id === selectedHomeId)?.name || "All Properties")}
                 </span>
               </div>
             </SelectTrigger>
             <SelectContent className="rounded-xl">
               <SelectItem value="all">All Properties</SelectItem>
               {visibleHomes.map(home => (
                 <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl p-16 text-center border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-3">No activity yet</h2>
          <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
            Your progress history will appear here once you start scanning and resolving hazards.
          </p>
        </motion.div>
      ) : (
        <div className="relative pl-8 md:pl-0">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 -translate-x-1/2" />
          <div className="md:hidden absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 ml-4" />

          <div className="space-y-12">
            {sortedEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative flex items-center ${isEven ? 'md:justify-start' : 'md:justify-end'} justify-end w-full`}
                >
                   {/* Marker */}
                   <div className="absolute left-[-32px] md:left-1/2 w-8 h-8 rounded-full bg-white dark:bg-black border-4 border-neutral-100 dark:border-neutral-800 flex items-center justify-center -translate-x-1/2 z-10 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                   </div>

                   {/* Content */}
                   <div className={`w-full md:w-[calc(50%-48px)] ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                     <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getEventBackground(event.type)}`}>
                              {getEventIcon(event.type)}
                           </div>
                           <div className="space-y-1">
                              <h3 className="font-medium tracking-tight text-lg">{event.title}</h3>
                              <p className="text-neutral-500 text-sm leading-relaxed">{event.description}</p>
                              <div className="flex items-center gap-2 pt-2 text-xs font-medium text-neutral-400">
                                <Clock className="w-3.5 h-3.5" />
                                {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
