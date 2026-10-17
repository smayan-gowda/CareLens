import { useMemo } from "react";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Camera, TrendingUp, MessageSquare, Wrench } from "lucide-react";
import type { ScanResult } from "@/types/ai";
import type { TimelineEvent } from "@/types/home";

interface RoomTimelineSectionProps {
  roomScans: ScanResult[];
  timelineEvents: TimelineEvent[];
}

type Entry = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  icon: typeof Camera;
  tone: string;
};

export function RoomTimelineSection({ roomScans, timelineEvents }: RoomTimelineSectionProps) {
  const scanIds = useMemo(() => new Set(roomScans.map((s) => s.id)), [roomScans]);

  const entries: Entry[] = useMemo(() => {
    const scanEntries: Entry[] = roomScans
      .filter((s) => s.status === "Completed")
      .map((s) => ({
        id: `scan-${s.id}`,
        timestamp: s.createdAt,
        title: "Assessment completed",
        description: `Safety score ${s.safetyScore} · ${s.hazards.length} finding${s.hazards.length === 1 ? "" : "s"}`,
        icon: Camera,
        tone: "text-brand",
      }));

    const eventEntries: Entry[] = timelineEvents
      .filter((e) => e.type !== "scan" && (e.roomId || (e.scanId && scanIds.has(e.scanId))))
      .map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        title: e.title,
        description: e.description,
        icon: e.type === "improvement" ? Wrench : e.type === "score_change" ? TrendingUp : MessageSquare,
        tone: e.type === "improvement" ? "text-success" : "text-muted-foreground",
      }));

    return [...scanEntries, ...eventEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [roomScans, timelineEvents, scanIds]);

  return (
    <div id="timeline" className="scroll-mt-24">
      <span className="field-tag text-muted-foreground block mb-3">Room Timeline</span>

      {entries.length === 0 ? (
        <div className="border-t border-b border-border py-14 text-center text-muted-foreground text-sm">
          Nothing recorded here yet.
        </div>
      ) : (
        <div className="relative pl-10 border-t border-border pt-10">
          <div className="absolute left-3.5 top-10 bottom-2 w-px bg-border" />
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: Math.min(i, 6) * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative pb-10 last:pb-0"
            >
              <div className="absolute -left-10 top-0.5 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center">
                <entry.icon className={`w-3.5 h-3.5 ${entry.tone}`} strokeWidth={1.75} />
              </div>
              <h3 className="font-medium tracking-tight text-base">{entry.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mt-1.5 max-w-lg">{entry.description}</p>
              <p className="tabular text-xs text-muted-foreground/60 mt-2.5">
                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
