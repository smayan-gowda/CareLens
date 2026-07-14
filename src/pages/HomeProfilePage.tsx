import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Settings, 
  Image as ImageIcon, 
  CheckCircle2, 
  Activity,
  ChevronRight,
  MoreVertical,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "motion/react";

export function HomeProfilePage() {
  const { homeId } = useParams();
  const navigate = useNavigate();
  const { homes, deleteHome, hiddenRooms } = useHomeStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const home = homes.find(h => h.id === homeId);
  
  if (!home) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-medium mb-2">Property not found</h2>
        <p className="text-neutral-500 mb-6 font-light">This property doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/properties")} className="rounded-full">Return to Properties</Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteHome(home.id);
    toast.success("Property removed");
    navigate("/properties");
  };

  const visibleRooms = home.rooms?.filter(r => !hiddenRooms.includes(r.id)) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/properties")}
          className="text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Properties
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem className="rounded-lg">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 rounded-lg" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Remove Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showDeleteConfirm && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 rounded-2xl p-6 flex items-center justify-between"
        >
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-medium">Remove this property?</h3>
            <p className="text-red-600 dark:text-red-500 text-sm mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-full">Confirm Delete</Button>
          </div>
        </motion.div>
      )}

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden bg-neutral-900 shadow-lg">
        {home.coverImage ? (
           <img src={home.coverImage} alt={home.name} className="w-full h-full object-cover opacity-60" />
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-8 left-8 right-8">
           <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-2">{home.name}</h1>
           <p className="text-white/70 flex items-center gap-2">
             <MapPin className="w-5 h-5" /> {home.address || "No address provided"}
           </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Main Content (Rooms) */}
        <div className="md:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium tracking-tight">Zones</h2>
            <Button 
              onClick={() => navigate(`/properties/${home.id}/rooms/new`)}
              className="rounded-full bg-black text-white px-6 shadow-md transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Zone
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {visibleRooms.length === 0 ? (
              <div className="sm:col-span-2 bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-12 text-center border border-neutral-200 dark:border-neutral-800">
                <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">No zones configured</h3>
                <p className="text-neutral-500 text-sm mb-6">Add rooms to this property to begin scanning for hazards.</p>
                <Button onClick={() => navigate(`/properties/${home.id}/rooms/new`)} variant="outline" className="rounded-full">Add First Zone</Button>
              </div>
            ) : (
              visibleRooms.map(room => (
                <motion.div 
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}`)}
                  className="group cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                       <ImageIcon className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-medium text-xl tracking-tight mb-1">{room.name}</h3>
                  <p className="text-sm text-neutral-500 capitalize">{room.type}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
             <h3 className="font-medium mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-neutral-400" /> Details
             </h3>
             <dl className="space-y-4 text-sm">
               <div>
                 <dt className="text-neutral-500">Property Nickname</dt>
                 <dd className="font-medium mt-1">{home.nickname || "—"}</dd>
               </div>
               <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                 <dt className="text-neutral-500">Added On</dt>
                 <dd className="font-medium mt-1">{format(home.createdAt, 'MMMM d, yyyy')}</dd>
               </div>
               <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                 <dt className="text-neutral-500">Total Zones</dt>
                 <dd className="font-medium mt-1">{visibleRooms.length}</dd>
               </div>
             </dl>
           </div>
        </div>
      </div>
    </div>
  );
}
