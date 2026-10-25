import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { UserCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LensMark } from "@/components/brand/LensMark";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { useHomeStore } from "@/stores/useHomeStore";
import { useStagingStore } from "@/stores/useStagingStore";

const navItems = [
  { id: "01", label: "Overview", path: "/overview" },
  { id: "02", label: "Properties", path: "/properties" },
  { id: "03", label: "Photo Library", path: "/library" },
  { id: "04", label: "Assessments", path: "/assessments" },
  { id: "05", label: "Marketplace", path: "/marketplace" },
];

/**
 * The Ledger Bar — CareLens's signature navigation. Modeled on a surveyor's
 * measuring strip / gauge readout: numbered tick-stations across a fixed
 * top bar with a running hairline, not icons in a dock and not a sidebar.
 * The one warm touch: a live thumbnail of the person's home sits beside the
 * mark, so even the chrome reminds them this is their house, not a tool.
 */
function LedgerBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { homes } = useHomeStore();
  const { photos } = useStagingStore();
  const unscannedCount = photos.filter(p => p.status === 'unscanned').length;
  const primaryHome = homes[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/overview")} className="flex items-center gap-3 shrink-0" aria-label="CareLens home">
            <LensMark className="w-5 h-5 text-brand" />
            <span className="hidden sm:block text-sm font-semibold tracking-tight">CARELENS</span>
            {primaryHome && (
              <span className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-border">
                <span className="w-6 h-6 overflow-hidden bg-muted shrink-0">
                  {primaryHome.coverImage ? (
                    <img src={primaryHome.coverImage} className="w-full h-full object-cover" alt="" />
                  ) : null}
                </span>
                <span className="text-[13px] text-muted-foreground truncate max-w-[140px]">{primaryHome.name}</span>
              </span>
            )}
          </button>

          <nav aria-label="Primary" className="hidden md:flex items-stretch h-16 flex-1 justify-center">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="relative flex items-center gap-2 px-5 h-full group"
                >
                  <span className={cn("tabular text-[11px] transition-colors", isActive ? "text-brand" : "text-muted-foreground/40 group-hover:text-muted-foreground")}>
                    {item.id}
                  </span>
                  <span className={cn("text-[13px] font-medium tracking-tight transition-colors flex items-center gap-1.5", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {item.label}
                    {(item.path === '/library' || item.path === '/vault') && unscannedCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="ledger-tick"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/scan")}
              className="hidden sm:flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-md bg-brand text-brand-foreground text-[13px] font-medium hover:brightness-105 transition-[filter,transform] active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.25} /> Scan
            </button>
            <NotificationCenter />
            <button
              onClick={() => navigate("/profile")}
              aria-label="Profile"
              className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <UserCircle className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Mobile station strip — same numbering system, condensed to icon-free text. */
function MobileBar() {
 const location = useLocation();
 const navigate = useNavigate();
 return (
 <nav
 aria-label="Primary"
 className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-border bg-background/95 backdrop-blur-md overflow-x-auto"
 >
 {navItems.map((item) => {
 const isActive = location.pathname.startsWith(item.path);
 return (
 <button
 key={item.id}
 onClick={() => navigate(item.path)}
 className="flex-1 min-w-[72px] flex flex-col items-center justify-center gap-1 py-2.5 relative"
 >
 <span className={cn("tabular text-[10px]", isActive ? "text-brand" : "text-muted-foreground/40")}>{item.id}</span>
 <span className={cn("text-[10px] font-medium tracking-tight", isActive ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
 {isActive && <span className="absolute top-0 left-3 right-3 h-[2px] bg-brand" />}
 </button>
 );
 })}
 </nav>
 );
}

export function AppLayout() {
 const location = useLocation();
 return (
 <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand/20">
 <LedgerBar />

 <main className="pt-16 pb-20 md:pb-0 min-h-screen">
 <AnimatePresence mode="wait">
 <motion.div
 key={location.pathname}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
 className={cn(
 "min-h-full",
 location.pathname.startsWith("/overview")
 ? ""
 : "max-w-[1400px] mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-20"
 )}
 >
 <Outlet />
 </motion.div>
 </AnimatePresence>
 </main>

 <MobileBar />
 </div>
 );
}
