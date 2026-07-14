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
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">Properties</h1>
          <p className="text-neutral-500 text-lg font-light">Manage and monitor the spaces you care about.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <Input 
              placeholder="Search properties..." 
              className="pl-10 h-12 rounded-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white shadow-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => navigate('/properties/new')}
            className="rounded-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-12 px-6 shrink-0 shadow-md transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Property
          </Button>
        </div>
      </div>

      {visibleHomes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl p-16 text-center border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-3">No properties yet</h2>
          <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
            Get started by adding a property to monitor its environmental safety and care setup.
          </p>
          <Button 
            onClick={() => navigate('/properties/new')}
            className="rounded-full bg-black text-white px-8 h-12"
          >
            Add your first property
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomes.map((home, index) => (
            <motion.div
              key={home.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate(`/properties/${home.id}`)}
              className="group cursor-pointer bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col"
            >
              <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                 {home.coverImage ? (
                   <img src={home.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={home.name} />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                 <div>
                    <h3 className="text-xl font-medium tracking-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                      {home.name}
                    </h3>
                    <p className="text-neutral-500 text-sm mt-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {home.address || "No address provided"}
                    </p>
                 </div>
                 
                 <div className="mt-8 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-4">
                    <div className="text-sm font-medium text-neutral-500">
                      {home.rooms?.length || 0} Rooms
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredHomes.length * 0.1, duration: 0.5 }}
            onClick={() => navigate('/properties/new')}
            className="group cursor-pointer bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl overflow-hidden border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors duration-300 flex flex-col items-center justify-center p-8 aspect-[4/3] md:aspect-auto"
          >
             <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
               <Plus className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
             </div>
             <h3 className="text-lg font-medium tracking-tight">Add New Property</h3>
             <p className="text-neutral-500 text-sm mt-1">Setup another location</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
