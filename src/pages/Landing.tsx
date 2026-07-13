import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Camera, Activity, Briefcase } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export function Landing() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">CareLens</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link to="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
          <Link to="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium hover:underline hidden sm:block">Log in</Link>
              <Button asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 md:py-32 px-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold mb-6 text-primary bg-primary/5">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Introducing the Digital Home Twin
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1] mb-6">
            Make any home safer with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">vision AI.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            CareLens acts as an intelligent accessibility assistant. Upload a photo of any room, and instantly receive actionable insights to prevent falls and improve independence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base" asChild>
              <Link to={user ? "/scan" : "/login"}>
                Analyze a Room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
              View Demo
            </Button>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-y px-6" id="features">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Professional safety assessments, instantly.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our computer vision models identify hazards and recommend solutions that even experts might miss during a brief visit.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-2xl border shadow-sm flex flex-col items-start transition-all hover:shadow-md">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Intelligent Scanning</h3>
                <p className="text-muted-foreground leading-relaxed">Simply upload photos of your living spaces. Our AI instantly detects trip hazards, poor lighting, and accessibility barriers.</p>
              </div>
              
              <div className="bg-card p-8 rounded-2xl border shadow-sm flex flex-col items-start transition-all hover:shadow-md">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Safety Score</h3>
                <p className="text-muted-foreground leading-relaxed">Get a quantifiable measure of your home's safety. Track improvements over time as you resolve identified risks.</p>
              </div>
              
              <div className="bg-card p-8 rounded-2xl border shadow-sm flex flex-col items-start transition-all hover:shadow-md">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community Resources</h3>
                <p className="text-muted-foreground leading-relaxed">Connect with local programs, grants, and professionals who can help implement the recommended home modifications.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-10 text-center text-muted-foreground border-t">
        <p>© 2026 CareLens AI. Designed for independence.</p>
      </footer>
    </div>
  );
}
