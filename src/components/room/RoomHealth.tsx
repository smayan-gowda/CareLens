import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import type { ScanResult } from "@/types/ai";
import { conditionLabel, scoreColor, attentionSummary } from "./roomMath";

interface RoomHealthProps {
  latestScan?: ScanResult;
  previousScan?: ScanResult;
}

export function RoomHealth({ latestScan, previousScan }: RoomHealthProps) {
  if (!latestScan) {
    return (
      <div id="overview" className="scroll-mt-24 border-t border-b border-border py-14 text-center">
        <p className="text-muted-foreground">Run an assessment to see how this room is doing.</p>
      </div>
    );
  }

  const delta = previousScan ? latestScan.safetyScore - previousScan.safetyScore : null;

  const rows = [
    { label: "Current condition", value: conditionLabel(latestScan.safetyScore), tone: scoreColor(latestScan.safetyScore) },
    {
      label: "Recent improvement",
      value: delta === null ? "First assessment" : delta > 0 ? `+${delta} points since last scan` : delta < 0 ? `${delta} points since last scan` : "No change since last scan",
      tone: delta && delta > 0 ? "text-success" : delta && delta < 0 ? "text-destructive" : "text-muted-foreground",
    },
    { label: "Areas requiring attention", value: attentionSummary(latestScan.hazards), tone: latestScan.hazards.length > 0 ? "text-foreground" : "text-muted-foreground" },
    { label: "Last scan", value: formatDistanceToNow(new Date(latestScan.createdAt), { addSuffix: true }), tone: "text-foreground" },
    { label: "Confidence", value: latestScan.roomConfidence ? `${latestScan.roomConfidence}%` : "—", tone: "text-foreground" },
  ];

  return (
    <div id="overview" className="scroll-mt-24">
      <span className="field-tag text-muted-foreground block mb-3">Room Health</span>
      <div className="border-t border-border">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between py-4 border-b border-border gap-6"
          >
            <span className="text-sm text-muted-foreground shrink-0">{row.label}</span>
            <span className={`text-sm font-medium text-right ${row.tone}`}>{row.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
