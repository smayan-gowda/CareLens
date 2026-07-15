import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Home, ShieldCheck, Activity, Users, Plus, Map, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "overview", label: "Overview", icon: Home, path: "/overview" },
  { id: "properties", label: "Properties", icon: ShieldCheck, path: "/properties" },
  { id: "scan", label: "Scan", icon: Plus, path: "/scan", primary: true },
  { id: "assessments", label: "Assessments", icon: Activity, path: "/assessments" },
  { id: "marketplace", label: "Marketplace", icon: Map, path: "/marketplace" },
  { id: "network", label: "Network", icon: Users, path: "/network" },
];

function FloatingDock() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <motion.div 
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="flex items-center gap-1 p-1.5 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && item.path !== "/";
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative group flex items-center justify-center p-3 rounded-full transition-all duration-300",
                item.primary 
                  ? "bg-foreground text-background hover:scale-105 shadow-md mx-1" 
                  : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && !item.primary && "text-foreground")} strokeWidth={isActive ? 2.5 : 2} />
              
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg pointer-events-none whitespace-nowrap shadow-xl">
                {item.label}
              </div>

              {isActive && !item.primary && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-40 pointer-events-none w-full">
           <div className="text-xl font-semibold tracking-tight pointer-events-auto flex items-center gap-2.5 px-4 py-2 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-sm">
             <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center text-background shadow-inner">
                <ShieldCheck className="w-4 h-4" />
             </div>
             CareLens
           </div>
           <button 
             onClick={() => navigate('/profile')}
             className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 flex items-center justify-center pointer-events-auto transition-transform hover:scale-105 shadow-sm text-foreground"
           >
              <UserCircle className="w-5 h-5" strokeWidth={2} />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden h-full w-full relative z-10 pt-32 pb-40 px-4 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full max-w-5xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <FloatingDock />
      </div>
    </div>
  );
}
