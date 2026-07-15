import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Plus, Home, MapPin, Search, ChevronRight } from "lucide-react";
import { useHomeStore } from "@/stores/useHomeStore";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export function HomesPage() {
  const { homes, hiddenHomes } = useHomeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const visibleHomes = homes.filter(h => !hiddenHomes.includes(h.id));
  
  const filteredHomes = visibleHomes.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-3">Properties</h1>
          <p className="text-muted-foreground text-lg font-light">Manage and monitor the spaces you care about.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search properties..." 
              className="pl-12 h-14 rounded-[1.5rem] bg-card border-border focus-visible:ring-1 focus-visible:ring-foreground shadow-sm text-base transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => navigate('/properties/new')}
            className="rounded-[1.5rem] bg-foreground text-background hover:bg-foreground/90 h-14 px-8 shrink-0 shadow-md transition-all active:scale-95 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Property
          </Button>
        </div>
      </div>

      {visibleHomes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card rounded-[2.5rem] p-16 text-center border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
        >
          <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-medium tracking-tight mb-3">No properties yet</h2>
          <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-light leading-relaxed">
            Get started by adding a property to monitor its environmental safety and care setup.
          </p>
          <Button 
            onClick={() => navigate('/properties/new')}
            className="rounded-[1.5rem] bg-foreground text-background px-8 h-14 text-base"
          >
            Add your first property
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHomes.map((home, index) => (
            <motion.div
              key={home.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate(`/properties/${home.id}`)}
              className="group cursor-pointer bg-card rounded-[2.5rem] overflow-hidden border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
            >
              <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                 {home.coverImage ? (
                   <img src={home.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={home.name} />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-muted-foreground/30" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                 <div>
                    <h3 className="text-2xl font-medium tracking-tight transition-colors">
                      {home.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-3 flex items-center gap-2 font-light">
                      <MapPin className="w-4 h-4" /> {home.address || "No address provided"}
                    </p>
                 </div>
                 
                 <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      {home.rooms?.length || 0} Rooms
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all duration-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredHomes.length * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate('/properties/new')}
            className="group cursor-pointer bg-card/50 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-border hover:border-foreground/30 transition-all duration-300 flex flex-col items-center justify-center p-8 aspect-[4/3] md:aspect-auto shadow-sm"
          >
             <div className="w-16 h-16 rounded-[1.5rem] bg-muted flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-foreground group-hover:text-background transition-all duration-500">
               <Plus className="w-6 h-6 text-muted-foreground group-hover:text-background transition-colors" />
             </div>
             <h3 className="text-xl font-medium tracking-tight">Add Property</h3>
             <p className="text-muted-foreground text-sm mt-2 font-light">Setup another location</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
