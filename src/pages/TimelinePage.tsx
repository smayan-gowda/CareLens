import { useState, useMemo } from "react";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import {
 Activity,
 CheckCircle2,
 Clock,
 FileText,
 Filter
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

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

 // Only the meaningful outcome (a resolved hazard) earns color. Everything
 // else is a neutral event — the brief was explicit: color communicates
 // meaning, it doesn't decorate a category.
 const getEventIcon = (type: string) => {
 switch (type) {
 case 'scan': return <Activity className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />;
 case 'hazard_resolved': return <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.75} />;
 case 'report': return <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />;
 default: return <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />;
 }
 };

 return (
 <div className="space-y-12">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div>
 <p className="field-tag text-muted-foreground mb-3">Log</p>
 <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">Progress History</h1>
 <p className="text-muted-foreground text-lg font-light max-w-xl">Assessments, resolved hazards, and safety improvements over time.</p>
 </div>

 <div className="w-full md:w-56">
 <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
 <SelectTrigger className="h-11 w-full">
 <div className="flex items-center gap-2 flex-1 text-left truncate">
 <Filter className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
 <span className="truncate">
 {selectedHomeId === "all" ? "All Properties" : (visibleHomes.find(h => h.id === selectedHomeId)?.name || "All Properties")}
 </span>
 </div>
 </SelectTrigger>
 <SelectContent>
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
 className="border-t border-b border-border/70 py-20 text-center"
 >
 <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-5" strokeWidth={1.5} />
 <h2 className="text-2xl font-semibold tracking-tight mb-3">No activity yet</h2>
 <p className="text-muted-foreground max-w-sm mx-auto font-light">
 Your progress history will appear here once you start scanning and resolving hazards.
 </p>
 </motion.div>
 ) : (
 <div className="relative pl-10">
 <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

 <div>
 {sortedEvents.map((event, index) => (
 <motion.div
 key={event.id}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-60px" }}
 transition={{ delay: Math.min(index, 6) * 0.06, duration: 0.5 }}
 className="relative pb-10"
 >
 <div className="absolute -left-10 top-0.5 w-7 h-7 bg-background border border-border flex items-center justify-center">
 {getEventIcon(event.type)}
 </div>
 <h3 className="font-medium tracking-tight text-base text-foreground">{event.title}</h3>
 <p className="text-muted-foreground text-sm leading-relaxed font-light mt-1.5 max-w-lg">{event.description}</p>
 <div className="flex items-center gap-2 pt-2.5 text-xs text-muted-foreground/60">
 {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
