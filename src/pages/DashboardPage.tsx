import { useState, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, ArrowUpRight, Plus, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { useStagingStore } from "@/stores/useStagingStore";
import { format } from "date-fns";
import { LensMark } from "@/components/brand/LensMark";
import { getRecommendationActionStatus } from "@/utils/recommendationActions";

export function DashboardPage() {
  const { homes, loading: homesLoading } = useHomeStore();
  const { scans, loading: scansLoading } = useScanStore();
  const { photos: stagedPhotos } = useStagingStore();
  const navigate = useNavigate();

  const unscannedCount = useMemo(() => stagedPhotos.filter(p => p.status === 'unscanned').length, [stagedPhotos]);

  const primaryHome = homes[0];
  const allScans = useMemo(() => Object.values(scans).flat(), [scans]);

  const activeReports = useMemo(() => {
    return allScans
      .filter(r => r.status === 'Completed' && r.hazards.length > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allScans]);

  const openActions = useMemo(
    () =>
      allScans.flatMap((scan) =>
        (scan.recommendations ?? [])
          .filter((recommendation) => {
            const status = getRecommendationActionStatus(recommendation);
            return status !== "verified" && status !== "dismissed";
          })
          .map((recommendation) => ({ scan, recommendation }))
      ),
    [allScans]
  );

  const allHazards = useMemo(() => activeReports.flatMap(r => r.hazards), [activeReports]);
  const highPriorityHazards = allHazards.filter(h => h.severity === 'High' || h.severity === 'Critical');

  const safetyScore = useMemo(() => {
    if (activeReports.length === 0) return 100;
    const deductions = allHazards.reduce((acc, curr) => {
      if (curr.severity === 'Critical') return acc + 15;
      if (curr.severity === 'High') return acc + 10;
      if (curr.severity === 'Medium') return acc + 5;
      return acc + 2;
    }, 0);
    return Math.max(0, 100 - deductions);
  }, [activeReports, allHazards]);

  // The one sentence that replaces "Safety Index: 83" — this is the actual
  // headline of the page. The number becomes a supporting detail, not the story.
  const narrative = useMemo(() => {
    if (activeReports.length === 0) return "Let's get to know your home.";
    if (highPriorityHazards.length === 0) return "Your home is in good condition.";
    if (highPriorityHazards.length === 1) return "One improvement could meaningfully reduce risk.";
    if (safetyScore < 60) return "A few areas need your attention soon.";
    return `${highPriorityHazards.length} small changes would make a real difference.`;
  }, [activeReports.length, highPriorityHazards.length, safetyScore]);

  const getScoreColor = (score: number) => (score >= 90 ? 'text-success' : score >= 70 ? 'text-warning' : 'text-destructive');

  const { scrollY } = useScroll();
  const heroImgY = useTransform(scrollY, [0, 600], [0, 90]);
  const heroTextY = useTransform(scrollY, [0, 350], [0, 30]);
  const heroFade = useTransform(scrollY, [0, 320], [1, 0.4]);

  const scoreMotion = useMotionValue(0);
  const scoreSpring = useSpring(scoreMotion, { stiffness: 60, damping: 18 });
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => { scoreMotion.set(safetyScore); }, [safetyScore, scoreMotion]);
  useEffect(() => {
    const unsub = scoreSpring.on("change", (v) => setDisplayScore(Math.round(v)));
    return () => unsub();
  }, [scoreSpring]);

  if (homesLoading || scansLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <LensMark className="w-6 h-6 text-brand animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {/* ===== The home, full-bleed — this is the hero, not a hazard count ===== */}
      <section className="relative w-screen left-1/2 -ml-[50vw] h-[72vh] min-h-[520px] overflow-hidden bg-neutral-900 photo-vignette">
        <motion.div style={{ y: heroImgY }} className="absolute inset-0 h-[130%]">
          {primaryHome?.coverImage ? (
            <img src={primaryHome.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--brand),transparent_55%),transparent_60%),linear-gradient(160deg,oklch(0.26_0.02_50),oklch(0.1_0.02_45))]" />
          )}
        </motion.div>

        <motion.div style={{ y: heroTextY, opacity: heroFade }} className="relative z-10 h-full flex flex-col justify-end px-5 md:px-10 pb-14 md:pb-16 max-w-3xl">
          <span className="field-tag text-white/50 mb-4">{format(new Date(), "EEEE, MMMM d")}</span>
          <h1 className="narrative text-white text-[2.75rem] leading-[1.05] sm:text-6xl md:text-7xl text-balance mb-3">
            {narrative}
          </h1>
          {primaryHome && (
            <p className="text-white/60 text-base md:text-lg">{primaryHome.name}{primaryHome.address ? ` · ${primaryHome.address}` : ''}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="brand" size="lg" onClick={() => navigate('/scan')}>
              <Camera className="mr-2 w-4 h-4" /> Run Assessment
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/library')}
              className="bg-white/5 hover:bg-white/10 text-white border-white/15 backdrop-blur-md relative cursor-pointer"
            >
              <Smartphone className="mr-2 w-4 h-4 text-brand" /> 
              <span>Photo Library</span>
              {unscannedCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand text-brand-foreground">
                  {unscannedCount}
                </span>
              )}
            </Button>
            {primaryHome && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/properties/${primaryHome.id}`)}
                className="bg-white/5 hover:bg-white/10 text-white border-white/15 backdrop-blur-md"
              >
                View Property
              </Button>
            )}
          </div>
        </motion.div>

        {/* Score — present, but a quiet annotation in the corner, not the headline */}
        {activeReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute z-10 top-8 right-5 md:right-10 text-right"
          >
            <span className="field-tag text-white/40 block mb-1">Safety Score</span>
            <span className={`tabular text-2xl font-semibold ${getScoreColor(safetyScore)}`}>{displayScore}</span>
          </motion.div>
        )}
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        {/* ===== Attention — dissolved into the page, no card wrapper ===== */}
        {highPriorityHazards.length > 0 ? (
          <section className="pt-16 md:pt-20">
            <div className="grid md:grid-cols-12 gap-8 md:gap-16">
              <div className="md:col-span-4">
                <span className="field-tag text-muted-foreground block mb-2">This week</span>
                <h2 className="text-3xl font-semibold tracking-tight mb-4">Worth a look</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These are the changes with the biggest impact on how safe your home feels day to day.
                </p>
              </div>
              <div className="md:col-span-8">
                <ol className="border-t border-border">
                  {highPriorityHazards.slice(0, 4).map((hazard, idx) => (
                    <motion.li
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06 }}
                      key={idx}
                      onClick={() => navigate('/assessments')}
                      className="group flex items-start gap-5 py-6 border-b border-border cursor-pointer"
                    >
                      <span className="tabular text-brand text-sm w-6 shrink-0 pt-0.5">{String(idx + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-[15px] tracking-tight">{hazard.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{hazard.description}</p>
                      </div>
                      <span className={`field-tag shrink-0 pt-0.5 ${hazard.severity === 'Critical' ? 'text-destructive' : 'text-warning'}`}>{hazard.severity}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors mt-0.5 shrink-0" />
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ) : activeReports.length > 0 ? (
          <section className="pt-16 md:pt-20 flex items-center gap-5 border-t border-border">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" strokeWidth={1.75} />
            <p className="text-muted-foreground">Nothing needs your attention right now — your most recent scans came back clear.</p>
          </section>
        ) : null}

        {openActions.length > 0 && (
          <section className="pt-16 md:pt-20">
            <div className="flex flex-col justify-between gap-6 border-y border-border py-8 sm:flex-row sm:items-center">
              <div>
                <span className="field-tag text-muted-foreground block mb-2">Next steps · all rooms</span>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {openActions.length} open improvement{openActions.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Accepted, deferred, and follow-up actions stay here until you close them after review.
                  Completing work alone never changes a room&apos;s measured safety score.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/improvement-plan")}>
                Open improvement plan <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {openActions.slice(0, 3).map(({ scan, recommendation }) => {
                const room = homes
                  .find((home) => home.id === scan.homeId)
                  ?.rooms.find((item) => item.id === scan.roomId);
                return (
                  <button
                    key={`${scan.id}-${recommendation.id}`}
                    type="button"
                    onClick={() => navigate("/improvement-plan")}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left hover:text-brand"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{recommendation.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {room?.name ?? scan.roomType ?? "Room"} · {getRecommendationActionStatus(recommendation).replaceAll("_", " ")}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Recent scans — a photographic strip, wide crops, not square thumbnails ===== */}
        {activeReports.length > 0 && (
          <section className="pt-16 md:pt-24 pb-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="field-tag text-muted-foreground block mb-2">Progress</span>
                <h2 className="text-3xl font-semibold tracking-tight">Recent rooms</h2>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
              {activeReports.slice(0, 6).map((report, idx) => {
                const img = (report as any).images?.[0] || (report as any).originalImage;
                return (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    key={report.id}
                    onClick={() => navigate(`/properties/${report.homeId}/rooms/${report.roomId}/assessments/${report.id}`)}
                    className="group relative shrink-0 w-64 h-80 overflow-hidden snap-start text-left photo-vignette"
                  >
                    {img ? (
                      <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <Camera className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <p className="text-white font-medium tracking-tight">{format(new Date(report.createdAt), "MMMM d")}</p>
                      <p className="text-white/60 text-sm mt-0.5">{report.hazards.length} finding{report.hazards.length === 1 ? '' : 's'}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}

        {!primaryHome && (
          <section className="pt-16 pb-20">
            <motion.div
              whileHover={{ scale: 1.005 }}
              onClick={() => navigate('/properties/new')}
              className="relative overflow-hidden bg-foreground text-background p-10 md:p-14 cursor-pointer group"
            >
              <LensMark className="absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.06] group-hover:scale-110 transition-transform duration-500" />
              <span className="field-tag text-background/50 block mb-4">Get started</span>
              <h3 className="narrative text-4xl md:text-5xl mb-4 relative z-10">Let's set up your first home.</h3>
              <p className="text-background/65 mb-8 max-w-md relative z-10 leading-relaxed">
                Add a property and we'll help you understand its safety, room by room.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-medium relative z-10 bg-background text-foreground px-5 py-2.5">
                <Plus className="w-4 h-4" /> Add Property
              </div>
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
}
