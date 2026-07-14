import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Camera, Activity, Briefcase, ChevronRight, Play, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion } from "motion/react";

export function Landing() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-foreground/10">
      <header className="px-6 md:px-12 py-5 flex items-center justify-between sticky top-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/40">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="bg-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-background" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">CareLens</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 bg-muted/30 px-6 py-2 rounded-full border border-border/50">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Platform</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Company</a>
        </nav>
        
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-foreground/80 transition-colors hidden sm:block text-muted-foreground">Sign in</Link>
              <Button className="rounded-full px-5 h-9 text-sm shadow-sm" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          ) : (
            <Button className="rounded-full px-5 h-9 text-sm shadow-sm" asChild>
              <Link to="/overview">Dashboard</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 px-6 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 opacity-50"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-8 text-foreground shadow-sm backdrop-blur-md"
          >
            CareLens 2.0 Early Access
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-tighter max-w-4xl leading-[1.05] mb-8 text-foreground"
          >
            Environmental safety, <br className="hidden md:block"/> powered by vision.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
          >
            Transform any smartphone into a clinical-grade accessibility scanner. Instantly detect fall hazards and generate professional safety reports.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-medium rounded-full shadow-sm" asChild>
              <Link to={user ? "/scan" : "/login"}>
                Analyze a Room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-sm font-medium rounded-full bg-transparent border-border/60 hover:bg-muted/30">
              Watch Demo
            </Button>
          </motion.div>
        </section>

        {/* Value Prop Mockup Section */}
        <section className="px-6 flex justify-center -mt-10 mb-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl w-full rounded-[2rem] border border-border/50 bg-background/50 p-2 md:p-3 shadow-2xl backdrop-blur-xl ring-1 ring-border/50"
          >
            <div className="rounded-[1.5rem] overflow-hidden border border-border/50 bg-card flex flex-col md:flex-row shadow-sm">
               <div className="flex-1 p-8 md:p-14 flex flex-col justify-center">
                 <div className="h-12 w-12 rounded-xl bg-foreground flex items-center justify-center mb-8 shadow-sm">
                   <Activity className="h-6 w-6 text-background" />
                 </div>
                 <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-5 text-foreground leading-tight">Precision hazard <br/> detection.</h3>
                 <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-light">
                   Our proprietary vision models detect subtle trip hazards, evaluate lighting conditions, and assess grab bar requirements with clinical accuracy.
                 </p>
                 <ul className="space-y-4">
                   {['Instant analysis of living spaces', 'Automated safety scoring', 'Actionable modification plans'].map((feature, i) => (
                     <li key={i} className="flex items-center text-sm font-medium text-foreground">
                       <CheckCircle2 className="h-5 w-5 text-muted-foreground mr-3" /> {feature}
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="flex-1 bg-muted/30 border-l border-border/50 relative min-h-[400px] overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]"></div>
                  <div className="absolute inset-0 p-8 flex flex-col gap-6 justify-center">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-background rounded-2xl p-5 shadow-sm border border-border/50 space-y-4 relative z-10"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3.5 w-24 bg-muted-foreground/10 rounded-full"></div>
                        <div className="h-6 w-16 bg-red-500/10 rounded-full border border-red-500/20"></div>
                      </div>
                      <div className="h-20 w-full bg-muted-foreground/5 rounded-xl border border-border/30"></div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-background rounded-2xl p-5 shadow-sm border border-border/50 space-y-4 opacity-70 relative z-10 translate-x-8"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3.5 w-32 bg-muted-foreground/10 rounded-full"></div>
                        <div className="h-6 w-16 bg-amber-500/10 rounded-full border border-amber-500/20"></div>
                      </div>
                      <div className="h-20 w-full bg-muted-foreground/5 rounded-xl border border-border/30"></div>
                    </motion.div>
                  </div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-32 bg-background border-t border-border/40" id="features">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">Professional assessments.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Advanced computer vision identifies hazards and recommends solutions that even experts might miss.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-muted/20 p-8 rounded-[2rem] border border-border/40 flex flex-col items-start transition-all hover:bg-muted/40 hover:border-border/60">
                <div className="h-12 w-12 rounded-xl bg-foreground flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                  <Camera className="h-6 w-6 text-background" />
                </div>
                <h3 className="text-xl font-semibold mb-3 tracking-tight">Intelligent Scanning</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Simply upload photos of your living spaces. Our AI instantly detects trip hazards, poor lighting, and accessibility barriers in real-time.</p>
              </div>
              
              <div className="group bg-muted/20 p-8 rounded-[2rem] border border-border/40 flex flex-col items-start transition-all hover:bg-muted/40 hover:border-border/60">
                <div className="h-12 w-12 rounded-xl bg-foreground flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                  <Activity className="h-6 w-6 text-background" />
                </div>
                <h3 className="text-xl font-semibold mb-3 tracking-tight">Safety Index</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Get a quantifiable measure of your home's safety. Track improvements over time as you resolve identified risks and build a safer environment.</p>
              </div>
              
              <div className="group bg-muted/20 p-8 rounded-[2rem] border border-border/40 flex flex-col items-start transition-all hover:bg-muted/40 hover:border-border/60">
                <div className="h-12 w-12 rounded-xl bg-foreground flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6 text-background" />
                </div>
                <h3 className="text-xl font-semibold mb-3 tracking-tight">Professional Network</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Connect with local programs, grants, and certified professionals who can help implement the recommended home modifications seamlessly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-12 border-t border-border/40 bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2.5 mb-4 md:mb-0">
            <div className="bg-foreground p-1 rounded-md">
              <ShieldCheck className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold tracking-tight">CareLens</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CareLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
