import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { LensMark } from "@/components/brand/LensMark";

// Curated, real architectural / interior photography — this is the product's
// emotional register, not decoration. Every section that needs a home shows
// an actual home.
const IMG = {
  exteriorDusk: "https://images.unsplash.com/photo-1757359056339-22968344cce6?q=80&w=2400&auto=format&fit=crop",
  livingRoom: "https://images.unsplash.com/photo-1759238136854-a43787126db7?q=80&w=2400&auto=format&fit=crop",
  staircase: "https://images.unsplash.com/photo-1759782526827-5fecfb5f2d9c?q=80&w=2400&auto=format&fit=crop",
  kitchen: "https://images.unsplash.com/photo-1764526624453-db32c24eca55?q=80&w=2400&auto=format&fit=crop",
};

const EASE = [0.16, 1, 0.3, 1] as const;

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Minimal, mostly-invisible nav — present only when needed, never competing with the photography. */
function SiteHeader() {
  const { user } = useAuthStore();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 40));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        solid ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <div className={`flex items-center gap-2.5 transition-colors duration-500 ${solid ? "text-foreground" : "text-white"}`}>
          <LensMark className="w-5 h-5 text-brand" />
          <span className="text-sm font-semibold tracking-tight">CARELENS</span>
        </div>
        <div className="flex items-center gap-5">
          {!user ? (
            <>
              <Link
                to="/login"
                className={`text-sm font-medium hidden sm:block transition-colors duration-500 ${
                  solid ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"
                }`}
              >
                Sign in
              </Link>
              <Button variant="brand" size="sm" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          ) : (
            <Button variant="brand" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Section 1 — Hero. Full viewport, architectural photography, gentle parallax. */
function Hero() {
  const { user } = useAuthStore();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-neutral-950">
      <motion.div style={{ y: imgY }} className="absolute inset-0 h-[120%]">
        <img src={IMG.exteriorDusk} alt="A quiet modern home at dusk" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/35" />
      </motion.div>

      <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 h-full flex flex-col justify-end px-6 md:px-10 pb-20 md:pb-28 max-w-[1600px] mx-auto w-full">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
          className="field-tag text-white/55 mb-6"
        >
          CareLens
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.45, ease: EASE }}
          className="narrative text-white text-[3.4rem] leading-[1.02] sm:text-7xl md:text-[6rem] max-w-4xl text-balance"
        >
          Know your home is <span className="text-brand">safe</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65, ease: EASE }}
          className="text-white/65 text-lg md:text-xl max-w-md mt-6 leading-relaxed"
        >
          A single photo, a clear answer — and a little more peace of mind about the people you love.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.85, ease: EASE }}
          className="flex flex-wrap gap-3 mt-10"
        >
          <Button variant="brand" size="lg" asChild>
            <Link to={user ? "/scan" : "/login"}>Try it on a room <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
          <Button variant="outline" size="lg" className="bg-white/5 hover:bg-white/10 text-white border-white/20 backdrop-blur-md">
            Watch how it works
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        style={{ opacity: fade }}
        className="absolute bottom-6 right-6 md:right-10 z-10 hidden sm:flex flex-col items-end gap-2 text-white/40"
      >
        <span className="field-tag">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-px h-8 bg-white/40"
        />
      </motion.div>
    </section>
  );
}

/** Section 2 — Transition. A photo becomes understanding: three states cross-fade
 *  as the reader scrolls through a single pinned frame — Photo → AI reading the
 *  room → the plain-language read. No dashboard chrome, no gauges. */
function Understanding() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const photoOpacity = useTransform(scrollYProgress, [0, 0.28, 0.42], [1, 1, 0]);
  const scanOpacity = useTransform(scrollYProgress, [0.28, 0.42, 0.62, 0.78], [0, 1, 1, 0]);
  const scanLineY = useTransform(scrollYProgress, [0.3, 0.62], ["0%", "100%"]);
  const readOpacity = useTransform(scrollYProgress, [0.68, 0.82], [0, 1]);
  const readY = useTransform(scrollYProgress, [0.68, 0.86], [24, 0]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative h-[280vh] bg-neutral-950">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.img
          style={{ scale: imgScale }}
          src={IMG.livingRoom}
          alt="A living room, as photographed for assessment"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <motion.div style={{ opacity: photoOpacity }} className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

        {/* Reading pass — a single quiet line sweeping the frame, not a sci-fi grid */}
        <motion.div style={{ opacity: scanOpacity }} className="absolute inset-0 bg-black/45">
          <motion.div style={{ top: scanLineY }} className="absolute left-0 right-0 h-px bg-brand shadow-[0_0_24px_4px_var(--brand)]" />
          <div className="absolute bottom-14 left-6 md:left-10">
            <span className="field-tag text-white/60">Reading the room</span>
          </div>
        </motion.div>

        {/* The plain-language read */}
        <motion.div style={{ opacity: readOpacity, y: readY }} className="absolute inset-0 flex items-end">
          <div className="px-6 md:px-10 pb-20 md:pb-28 max-w-[1600px] mx-auto w-full">
            <span className="field-tag text-white/55 block mb-5">What CareLens sees</span>
            <p className="narrative text-white text-4xl md:text-6xl max-w-3xl text-balance leading-[1.08]">
              "Good light, clear paths — but that rug by the sofa is worth a second look."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Section 3 — The experience, told as a sequence, not a feature grid.
 *  Alternating editorial rows: a number, a short beat of narration, a photograph. */
function Experience() {
  const steps = [
    { n: "01", title: "Take a photo", copy: "However you'd normally see the room — no special angle, no equipment. Just what's there.", img: IMG.livingRoom },
    { n: "02", title: "CareLens looks closely", copy: "The same things a careful visitor would notice: footing, lighting, what's within reach.", img: IMG.staircase },
    { n: "03", title: "You get a plain-language read", copy: "Not a spreadsheet of scores — a short, honest sense of how the room is doing.", img: IMG.kitchen },
    { n: "04", title: "One next step, not twenty", copy: "The single change most worth making, with real people nearby who can help if you want it.", img: IMG.livingRoom },
  ];

  return (
    <section className="py-28 md:py-40 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        <FadeUp className="max-w-2xl mb-20 md:mb-28">
          <span className="field-tag text-muted-foreground block mb-5">How it works</span>
          <h2 className="narrative text-4xl md:text-6xl text-balance">Less like software. More like a second pair of eyes.</h2>
        </FadeUp>

        <div>
          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.05}>
              <div className={`grid md:grid-cols-12 gap-8 md:gap-16 items-center py-14 md:py-20 border-t border-border ${i === steps.length - 1 ? "border-b" : ""}`}>
                <div className={`md:col-span-5 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <span className="tabular text-brand text-sm block mb-5">{s.n}</span>
                  <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">{s.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">{s.copy}</p>
                </div>
                <div className={`md:col-span-7 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <div className="aspect-[16/10] overflow-hidden photo-vignette">
                    <motion.img
                      initial={{ scale: 1.08 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: EASE }}
                      src={s.img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section 4 — Before / After, told as a comparison of two sentences and one
 *  photograph, not a slider gimmick or a stat card. */
function BeforeAfter() {
  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div className="absolute inset-0">
        <img src={IMG.staircase} alt="A staircase" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-10">
        <FadeUp className="max-w-xl mb-16 md:mb-20">
          <span className="field-tag text-white/50 block mb-5">One change, noticed</span>
          <h2 className="narrative text-white text-4xl md:text-6xl text-balance">Small fixes carry more weight than they look like they should.</h2>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-10 md:gap-20 max-w-4xl">
          <FadeUp delay={0.1}>
            <span className="field-tag text-white/40 block mb-4">Before</span>
            <p className="narrative text-white/70 text-2xl md:text-3xl leading-snug text-balance">
              "The staircase has uneven lighting and no handrail on one side."
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <span className="field-tag text-brand block mb-4">After one recommendation</span>
            <p className="narrative text-white text-2xl md:text-3xl leading-snug text-balance">
              "A single motion light and handrail turned a risk into a non-issue."
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/** Section 5 — Trust. Philosophy, not testimonials. */
function Philosophy() {
  return (
    <section className="py-28 md:py-40 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <FadeUp className="md:col-span-4">
            <span className="field-tag text-muted-foreground block">What we believe</span>
          </FadeUp>
          <FadeUp delay={0.1} className="md:col-span-8">
            <p className="narrative text-4xl md:text-6xl leading-[1.15] text-balance">
              We don't replace inspectors. We help families notice what they might otherwise miss.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mt-10 max-w-xl">
              CareLens isn't trying to be clinical. It's trying to be the friend who visits, glances around, and gently says — "hey, you might want to look at that step."
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/** Section 6 — Final CTA. Editorial, minimal, one photograph, one line. */
function FinalCTA() {
  const { user } = useAuthStore();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);

  return (
    <section ref={ref} className="relative h-[80vh] min-h-[560px] overflow-hidden bg-neutral-950">
      <motion.div style={{ scale: imgScale }} className="absolute inset-0">
        <img src={IMG.kitchen} alt="A quiet, well-lit kitchen" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <FadeUp>
          <h2 className="narrative text-white text-5xl md:text-8xl leading-[1.02] text-balance max-w-4xl">
            Start with one photo.
          </h2>
        </FadeUp>
        <FadeUp delay={0.15}>
          <Button variant="brand" size="lg" className="mt-10" asChild>
            <Link to={user ? "/scan" : "/login"}>Try CareLens <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </FadeUp>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <LensMark className="w-4 h-4 text-brand" />
          <span className="text-sm font-semibold tracking-tight">CARELENS</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Contact <ArrowUpRight className="w-3 h-3" />
          </a>
        </nav>
        <p className="tabular text-xs text-muted-foreground">© {new Date().getFullYear()} CareLens</p>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-brand/20">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Understanding />
        <Experience />
        <BeforeAfter />
        <Philosophy />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
