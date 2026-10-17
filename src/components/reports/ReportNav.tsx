import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "findings", label: "Findings" },
  { id: "images", label: "Images" },
  { id: "recommendations", label: "Recommendations" },
  { id: "timeline", label: "Timeline" },
];

export function ReportNav() {
  const [active, setActive] = useState("overview");
  const [visible, setVisible] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const heroEl = document.getElementById("report-hero-sentinel");

    const heroObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" }
    );
    if (heroEl) heroObserver.observe(heroEl);

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const offsets = SECTIONS.map((s) => {
          const el = document.getElementById(s.id);
          if (!el) return { id: s.id, top: Infinity };
          return { id: s.id, top: Math.abs(el.getBoundingClientRect().top - 120) };
        });
        offsets.sort((a, b) => a.top - b.top);
        if (offsets[0]) setActive(offsets[0].id);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      heroObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : -8, opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border"
    >
      <nav className="max-w-[1200px] mx-auto px-5 md:px-10 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={cn(
              "relative shrink-0 px-4 py-3.5 text-sm font-medium transition-colors",
              active === s.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
            {active === s.id && (
              <motion.span
                layoutId="report-nav-tick"
                className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </nav>
    </motion.div>
  );
}
