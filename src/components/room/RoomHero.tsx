import { motion, useScroll, useTransform } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import type { ScanResult } from "@/types/ai";
import type { Room } from "@/types/home";
import { projectedScore } from "@/components/reports/reportMath";
import { scoreColor } from "./roomMath";

interface RoomHeroProps {
  room: Room;
  heroImage?: string;
  latestScan?: ScanResult;
}

export function RoomHero({ room, heroImage, latestScan }: RoomHeroProps) {
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 500], [0, 60]);

  const potential = latestScan ? projectedScore(latestScan.safetyScore, latestScan.recommendations) : undefined;
  const gain = potential && latestScan ? potential - latestScan.safetyScore : 0;
  const topRec = latestScan?.recommendations?.[0];

  const oneLiner = !latestScan
    ? "No assessments yet — run a scan to see how this room is doing."
    : gain > 0 && topRec
    ? `One recommendation could increase safety by ${topRec.expectedImpact} points.`
    : latestScan.hazards.length === 0
    ? "Nothing needs your attention here right now."
    : "A few small things are worth a look.";

  return (
    <div id="room-hero-sentinel" className="relative w-screen left-1/2 -ml-[50vw] h-[64vh] min-h-[440px] overflow-hidden bg-neutral-900 photo-vignette">
      {heroImage ? (
        <motion.img style={{ y: imgY }} src={heroImage} alt={room.name} className="w-full h-[120%] object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--brand),transparent_55%),transparent_60%),linear-gradient(160deg,oklch(0.26_0.02_50),oklch(0.1_0.02_45))]" />
      )}

      <div className="relative z-10 h-full flex flex-col justify-end px-5 md:px-10 pb-12 md:pb-16 max-w-[1400px] mx-auto">
        <span className="field-tag text-white/50 mb-3 block capitalize">
          {room.type} · {latestScan ? `Last analyzed ${formatDistanceToNow(new Date(latestScan.createdAt), { addSuffix: true })}` : "Not yet analyzed"}
        </span>

        <div className="flex flex-wrap items-end gap-x-5 gap-y-2 mb-4">
          <h1 className="narrative text-white text-5xl md:text-7xl text-balance">{room.name}</h1>
          {latestScan && (
            <span className={`tabular text-3xl md:text-4xl font-semibold ${scoreColor(latestScan.safetyScore)}`}>
              {latestScan.safetyScore}
            </span>
          )}
        </div>

        <p className="text-white/65 text-base md:text-lg max-w-lg leading-relaxed">{oneLiner}</p>
      </div>
    </div>
  );
}
