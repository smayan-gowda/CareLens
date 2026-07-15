import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Settings, 
  UploadCloud, 
  Image as ImageIcon,
  MoreVertical,
  X,
  Trash2,
  Camera,
  ChevronRight
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export function RoomDetailPage() {
  const { homeId, roomId } = useParams();
  const navigate = useNavigate();
  const { homes, deleteRoom } = useHomeStore();
  const { getScansForRoom } = useScanStore();
  
  const [showDeleteRoomConfirm, setShowDeleteRoomConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const home = homes.find(h => h.id === homeId);
  const room = home?.rooms.find(r => r.id === roomId);
  const roomScans = getScansForRoom(roomId || '').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!home || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-medium mb-2">Zone not found</h2>
        <p className="text-neutral-500 mb-6 font-light">This zone doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(`/properties/${homeId}`)} className="rounded-full">Return to Property</Button>
      </div>
    );
  }

  const handleDeleteRoom = () => {
    deleteRoom(home.id, room.id);
    toast.success("Zone removed");
    navigate(`/properties/${home.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
             <Button 
               variant="ghost" 
               size="icon" 
               className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full"
               onClick={() => setSelectedImage(null)}
             >
               <X className="w-6 h-6" />
             </Button>
             <motion.img 
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               src={selectedImage} 
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
             />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/properties/${home.id}`)}
          className="text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {home.name}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem className="text-red-600 rounded-lg" onClick={() => setShowDeleteRoomConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Remove Zone
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showDeleteRoomConfirm && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 rounded-2xl p-6 flex items-center justify-between"
        >
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-medium">Remove this zone?</h3>
            <p className="text-red-600 dark:text-red-500 text-sm mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteRoomConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRoom} className="rounded-full">Confirm Delete</Button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-2">{room.name}</h1>
          <p className="text-neutral-500 text-lg font-light capitalize">{room.type} • Added {format(room.createdAt, 'MMM yyyy')}</p>
        </div>
        <Button 
           onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}/scan`)}
           className="rounded-full bg-black text-white px-8 h-12 shadow-lg transition-transform hover:scale-105"
        >
           <Camera className="w-5 h-5 mr-2" /> New Assessment
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        
        {/* Left Col: Scans & History */}
        <div className="md:col-span-2 space-y-8">
           <h2 className="text-2xl font-medium tracking-tight">Assessment History</h2>
           
           <div className="space-y-6">
              {roomScans.length === 0 ? (
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] p-12 text-center border border-black/5 dark:border-white/5">
                  <div className="w-16 h-16 bg-white dark:bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Camera className="w-6 h-6 text-neutral-400" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">No assessments yet</h3>
                  <p className="text-neutral-500 text-sm mb-6 max-w-xs mx-auto font-light">Run a technical scan to identify environmental hazards.</p>
                </div>
              ) : (
                roomScans.map((scan) => (
                  <motion.div 
                    key={scan.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}/assessments/${scan.id}`)}
                    className="group cursor-pointer bg-card border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[2rem] p-5 flex gap-6 hover:shadow-xl transition-all duration-300"
                  >
                     <div className="w-32 h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 relative border border-black/5 dark:border-white/5">
                        {scan.images?.[0] || (scan as any).originalImage ? (
                          <img src={scan.images?.[0] || (scan as any).originalImage} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-neutral-300" />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 py-2 pr-2 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className="font-medium text-lg">Environmental Audit</h3>
                             <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                                <ChevronRight className="w-5 h-5" />
                             </div>
                          </div>
                          <p className="text-sm text-muted-foreground font-light">{format(scan.createdAt, 'MMMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-sm font-medium">{scan.hazards.length} Findings</span>
                           {scan.hazards.filter(h => h.severity === 'High' || h.severity === 'Critical').length > 0 && (
                             <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Critical Issues</span>
                           )}
                        </div>
                     </div>
                  </motion.div>
                ))
              )}
           </div>
        </div>

        {/* Right Col: Gallery */}
        <div className="space-y-6">
           <h2 className="text-2xl font-medium tracking-tight">Gallery</h2>
           
           <div className="grid grid-cols-2 gap-4">
              {room.images?.length > 0 ? (
                room.images.map((img) => (
                  <div 
                    key={img.id} 
                    className="aspect-square rounded-[1.5rem] overflow-hidden cursor-pointer relative group bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 shadow-sm"
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-card rounded-[2.5rem] p-8 text-center border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500 font-light">No reference photos</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
