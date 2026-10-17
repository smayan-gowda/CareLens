import { motion } from "motion/react";
import type { ScanResult } from "@/types/ai";
import { buildExecutiveSummary } from "./reportMath";

interface ExecutiveSummaryProps {
  scan: ScanResult;
}

export function ExecutiveSummary({ scan }: ExecutiveSummaryProps) {
  const summary = buildExecutiveSummary({
    roomType: scan.roomType,
    safetyScore: scan.safetyScore,
    hazards: scan.hazards,
  });

  return (
    <div className="py-10 border-b border-border">
      <span className="field-tag text-muted-foreground block mb-4">Executive Summary</span>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="narrative text-2xl md:text-3xl leading-[1.35] text-balance max-w-3xl"
      >
        {summary}
      </motion.p>
    </div>
  );
}
