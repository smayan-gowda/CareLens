import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Home, ShieldCheck, Activity, Users, Settings, Plus, Map, UserCircle } from "lucide-react";
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center gap-1.5 px-3 py-3 bg-white/70 dark:bg-black/70 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-full shadow-2xl"
      >
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && item.path !== "/";
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative group flex items-center justify-center p-3.5 rounded-full transition-all duration-300",
                item.primary 
                  ? "bg-black text-white dark:bg-white dark:text-black hover:scale-105 shadow-md" 
                  : "hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && !item.primary && "text-black dark:text-white")} />
              
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-lg pointer-events-none whitespace-nowrap dark:bg-white dark:text-black shadow-lg backdrop-blur-md">
                {item.label}
              </div>

              {isActive && !item.primary && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-foreground/10">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40 pointer-events-none max-w-7xl mx-auto w-full">
           <div className="text-xl font-semibold tracking-tight pointer-events-auto flex items-center gap-2">
             <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black shadow-sm">
                <ShieldCheck className="w-4 h-4" />
             </div>
             CareLens
           </div>
           <button 
             onClick={() => navigate('/profile')}
             className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/5 dark:border-white/10 flex items-center justify-center pointer-events-auto transition-transform hover:scale-105 shadow-sm"
           >
              <UserCircle className="w-5 h-5" />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden h-full w-full relative z-10 pt-28 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
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
