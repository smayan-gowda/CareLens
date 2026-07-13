import { useState, useEffect } from "react";
import { Menu, Search, Home as HomeIcon, MapPin, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate, Link } from "react-router-dom";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NotificationCenter } from "./NotificationCenter";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { homes } = useHomeStore();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const userAvatar = profile?.avatar || user?.photoURL;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 md:px-6 backdrop-blur">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      <div className="flex-1">
        <Button
          variant="outline"
          className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
          onClick={() => setOpen(true)}
        >
          <span className="hidden lg:inline-flex">Search homes, rooms...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search Homes and Rooms</DialogTitle>
        <DialogDescription className="sr-only">Search through your homes, rooms, and uploaded images.</DialogDescription>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {homes.length > 0 && (
            <CommandGroup heading="Homes">
              {homes.map((home) => (
                <CommandItem
                  key={home.id}
                  value={home.name + " " + home.address}
                  onSelect={() => runCommand(() => navigate(`/homes/${home.id}`))}
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  <span>{home.nickname || home.name}</span>
                  {home.address && (
                    <span className="ml-2 text-xs text-muted-foreground flex items-center">
                      <MapPin className="mr-1 h-3 w-3" /> {home.address}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {homes.some(h => h.rooms.length > 0) && (
            <CommandGroup heading="Rooms">
              {homes.map(home => 
                home.rooms.map(room => (
                  <CommandItem
                    key={room.id}
                    value={room.name + " " + home.name + " " + room.type}
                    onSelect={() => runCommand(() => navigate(`/homes/${home.id}/rooms/${room.id}`))}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium">{room.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">({room.type})</span>
                      </div>
                      <span className="text-xs text-muted-foreground">in {home.name}</span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <div className="flex items-center gap-3">
        <NotificationCenter />
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/60 hover:bg-muted group transition-all">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
            <span className="sr-only">Settings</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
