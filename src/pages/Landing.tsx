import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Camera, Activity, Briefcase, Play } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion, useScroll, useTransform } from "motion/react";

export function Landing() {
  const { user } = useAuthStore();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/60 backdrop-blur-3xl border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-foreground p-1.5 rounded-xl shadow-inner">
            <ShieldCheck className="h-5 w-5 text-background" />
          </div>
          <span className="text-lg font-medium tracking-tight">CareLens</span>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Platform</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Company</a>
        </nav>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Sign in</Link>
              <Button className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          ) : (
            <Button className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-32 md:pt-48 md:pb-40 px-6 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center rounded-full border border-black/5 dark:border-white/5 bg-muted/50 backdrop-blur-md px-4 py-1.5 text-sm font-medium mb-8 text-muted-foreground"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-3 animate-pulse"></span>
            Introducing CareLens 2.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl font-medium tracking-tighter max-w-5xl leading-[1.05] mb-8 text-foreground"
          >
            Safety, seen clearly.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed font-light tracking-wide"
          >
            CareLens transforms your smartphone into a clinical-grade environmental scanner. Instantly detect hazards and generate professional safety reports.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full bg-foreground text-background hover:scale-105 active:scale-95 transition-all shadow-xl" asChild>
              <Link to={user ? "/scan" : "/login"}>
                Analyze a Room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 text-base rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
              <Play className="mr-2 h-4 w-4" /> Watch Demo
            </Button>
          </motion.div>
        </section>

        {/* Value Prop Mockup Section */}
        <section className="px-6 py-12 flex justify-center -mt-16 mb-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: y1 }}
            className="max-w-6xl w-full rounded-[2.5rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)] bg-white/40 dark:bg-neutral-900/40 backdrop-blur-3xl border border-black/5 dark:border-white/10"
          >
            <div className="rounded-[2rem] overflow-hidden border border-black/5 dark:border-white/5 bg-card flex flex-col md:flex-row h-full min-h-[500px]">
               <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
                 <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-8 border border-black/5 dark:border-white/5 shadow-sm">
                   <Activity className="h-5 w-5 text-foreground" />
                 </div>
                 <h3 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">Precision detection.</h3>
                 <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-light">
                   Our proprietary vision models detect subtle trip hazards, evaluate lighting conditions, and assess structural requirements with clinical accuracy.
                 </p>
                 <ul className="space-y-5">
                   {['Instant analysis of living spaces', 'Automated safety scoring', 'Actionable modification plans'].map((feature, i) => (
                     <li key={i} className="flex items-center text-base font-medium text-foreground/80">
                       <ShieldCheck className="h-5 w-5 text-emerald-500 mr-4 shrink-0" /> {feature}
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="flex-1 bg-muted/20 border-l border-black/5 dark:border-white/5 relative flex items-center justify-center p-8">
                  {/* Elegant Abstract UI Representation */}
                  <div className="w-full max-w-sm space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="bg-card rounded-[2rem] p-6 shadow-2xl border border-black/5 dark:border-white/5 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="h-4 w-24 bg-muted rounded-full" />
                        </div>
                        <div className="h-8 w-16 bg-red-50 dark:bg-red-500/10 rounded-full" />
                      </div>
                      <div className="h-24 w-full bg-muted/50 rounded-2xl" />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="bg-card rounded-[2rem] p-6 shadow-2xl border border-black/5 dark:border-white/5 space-y-4 ml-8"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-amber-400" />
                          <div className="h-4 w-32 bg-muted rounded-full" />
                        </div>
                        <div className="h-8 w-16 bg-amber-50 dark:bg-amber-500/10 rounded-full" />
                      </div>
                      <div className="h-24 w-full bg-muted/50 rounded-2xl" />
                    </motion.div>
                  </div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-32 bg-background" id="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">Professional assessments.</h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-light leading-relaxed">Advanced computer vision identifies hazards and recommends solutions that even experts might miss.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-card p-10 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-8 border border-black/5 dark:border-white/5 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-medium mb-4 tracking-tight">Intelligent Scanning</h3>
                <p className="text-muted-foreground leading-relaxed text-base font-light">Simply upload photos of your living spaces. Our AI instantly detects trip hazards, poor lighting, and accessibility barriers in real-time.</p>
              </div>
              
              <div className="group bg-card p-10 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-8 border border-black/5 dark:border-white/5 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-medium mb-4 tracking-tight">Safety Index</h3>
                <p className="text-muted-foreground leading-relaxed text-base font-light">Get a quantifiable measure of your home's safety. Track improvements over time as you resolve identified risks and build a safer environment.</p>
              </div>
              
              <div className="group bg-card p-10 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-8 border border-black/5 dark:border-white/5 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-medium mb-4 tracking-tight">Professional Network</h3>
                <p className="text-muted-foreground leading-relaxed text-base font-light">Connect with local programs, grants, and certified professionals who can help implement the recommended home modifications seamlessly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-16 border-t border-black/5 dark:border-white/5 bg-card">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="bg-foreground p-1.5 rounded-lg shadow-inner">
              <ShieldCheck className="h-4 w-4 text-background" />
            </div>
            <span className="font-medium tracking-tight text-lg">CareLens</span>
          </div>
          <p className="text-sm text-muted-foreground font-light">© {new Date().getFullYear()} CareLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
