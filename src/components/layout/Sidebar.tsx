import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  LayoutDashboard, 
  Camera, 
  FileText, 
  Clock, 
  Briefcase,
  Users,
  Settings,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { name: "My Homes", to: "/homes", icon: Home },
  { name: "Scan Room", to: "/scan", icon: Camera },
  { name: "Reports", to: "/reports", icon: FileText },
  { name: "Timeline", to: "/timeline", icon: Clock },
  { name: "Resources", to: "/resources", icon: Briefcase },
  { name: "Community", to: "/community", icon: Users },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
        <span className="font-semibold text-lg tracking-tight">CareLens</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" asChild>
          <NavLink to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </NavLink>
        </Button>
      </div>
    </aside>
  );
}
