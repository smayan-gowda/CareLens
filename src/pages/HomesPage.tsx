import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Plus, Home, MapPin, Search, ArrowUpRight } from "lucide-react";
import { useHomeStore } from "@/stores/useHomeStore";
import { useNavigate } from "react-router-dom";
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
    <div className="space-y-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="field-tag text-muted-foreground block mb-2">Your homes</span>
          <h1 className="narrative text-5xl md:text-6xl mb-2">Where you live.</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input placeholder="Search" className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button variant="brand" onClick={() => navigate('/properties/new')} className="w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Add Property
          </Button>
        </div>
      </div>

      {visibleHomes.length === 0 ? (
        <div className="border-b border-border py-24 text-center">
          <div className="w-14 h-14 border border-border flex items-center justify-center mx-auto mb-6">
            <Home className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">No properties yet</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Add a property to begin understanding its safety, room by room.</p>
          <Button variant="brand" onClick={() => navigate('/properties/new')}>Add your first property</Button>
        </div>
      ) : (
        <div>
          {filteredHomes.map((home, index) => {
            const reversed = index % 2 === 1;
            return (
              <motion.div
                key={home.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                onClick={() => navigate(`/properties/${home.id}`)}
                className="group cursor-pointer border-b border-border py-10 md:py-16 flex flex-col md:flex-row items-start gap-8 md:gap-16"
              >
                <div className={`w-full md:w-[56%] shrink-0 ${reversed ? "md:order-2" : ""}`}>
                  <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden photo-vignette">
                    {home.coverImage ? (
                      <img src={home.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={home.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex-1 flex flex-col justify-center h-full min-h-[160px] ${reversed ? "md:order-1" : ""}`}>
                  <span className="tabular text-brand text-xs mb-4 block">{String(index + 1).padStart(2, "0")} / {String(filteredHomes.length).padStart(2, "0")}</span>
                  <h3 className="narrative text-4xl md:text-5xl group-hover:text-brand transition-colors mb-4">
                    {home.name}
                  </h3>
                  <p className="text-muted-foreground text-base flex items-center gap-2 mb-6">
                    <MapPin className="w-4 h-4 shrink-0" /> {home.address || "No address provided"}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 group-hover:text-brand transition-colors">
                    {home.rooms?.length || 0} rooms monitored <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}

          <button
            onClick={() => navigate('/properties/new')}
            className="group w-full flex items-center justify-between py-8 text-left"
          >
            <div className="flex items-center gap-5">
              <div className="w-11 h-11 border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-300 shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium tracking-tight text-foreground">Add another property</h3>
                <p className="text-muted-foreground text-sm">Set up a new location to monitor</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}
