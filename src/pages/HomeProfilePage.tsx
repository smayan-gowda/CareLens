import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { Button } from "@/components/ui/button";
import {
 ArrowLeft,
 MapPin,
 Plus,
 Settings,
 ArrowUpRight,
 MoreVertical,
 Trash2,
 Camera,
 Upload
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "motion/react";
import { processImageForStorage } from "@/services/storageService";

export function HomeProfilePage() {
 const { homeId } = useParams();
 const navigate = useNavigate();
 const { homes, deleteHome, updateHome, hiddenRooms } = useHomeStore();
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const home = homes.find(h => h.id === homeId);

 if (!home) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
 <h2 className="text-2xl font-medium mb-2">Property not found</h2>
 <p className="text-muted-foreground mb-6">This property doesn't exist or has been removed.</p>
 <Button onClick={() => navigate("/properties")}>Return to Properties</Button>
 </div>
 );
 }

 const handleDelete = () => {
 deleteHome(home.id);
 toast.success("Property removed");
 navigate("/properties");
 };

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file) return;
   setIsUploading(true);
   try {
     const photoUrl = await processImageForStorage(file, home.coverImage);
     await updateHome(home.id, { coverImage: photoUrl });
     toast.success("Property photo updated!");
   } catch {
     toast.error("Failed to update property photo.");
   } finally {
     setIsUploading(false);
     if (fileInputRef.current) fileInputRef.current.value = "";
   }
 };

 const visibleRooms = home.rooms?.filter(r => !hiddenRooms.includes(r.id)) || [];

 return (
 <div className="space-y-10">
 <input
   type="file"
   ref={fileInputRef}
   onChange={handleImageUpload}
   accept="image/*"
   className="hidden"
 />

 {/* Back & Actions */}
 <div className="flex items-center justify-between">
 <Button variant="ghost" onClick={() => navigate("/properties")}>
 <ArrowLeft className="w-4 h-4 mr-2" /> Properties
 </Button>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
   <Upload className="w-4 h-4 mr-2" /> Upload Photo
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon">
 <MoreVertical className="w-5 h-5" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
 <Camera className="w-4 h-4 mr-2" /> Change Cover Photo
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => navigate("/settings")}>
 <Settings className="w-4 h-4 mr-2" /> Settings
 </DropdownMenuItem>
 <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteConfirm(true)}>
 <Trash2 className="w-4 h-4 mr-2" /> Remove Property
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>

 {showDeleteConfirm && (
 <motion.div
 initial={{ opacity: 0, scale: 0.97 }}
 animate={{ opacity: 1, scale: 1 }}
 className="bg-destructive/10 border border-destructive/20 rounded-md p-6 flex items-center justify-between"
 >
 <div>
 <h3 className="text-destructive font-medium">Remove this property?</h3>
 <p className="text-destructive/80 text-sm mt-1">This action cannot be undone.</p>
 </div>
 <div className="flex gap-3">
 <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
 <Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
 </div>
 </motion.div>
 )}

 {/* Hero */}
 <div className="relative h-[60vh] min-h-[420px] overflow-hidden bg-neutral-900 photo-vignette group">
 {home.coverImage ? (
 <img src={home.coverImage} alt={home.name} className="w-full h-full object-cover" />
 ) : (
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--brand),transparent_55%),transparent_60%),linear-gradient(160deg,oklch(0.26_0.02_50),oklch(0.1_0.02_45))]" />
 )}

 <button
   onClick={() => fileInputRef.current?.click()}
   className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 z-20 cursor-pointer"
 >
   <Camera className="w-3.5 h-3.5" />
   <span>Change Photo</span>
 </button>

 <div className="absolute bottom-8 md:bottom-12 left-5 md:left-10 right-8 z-10">
 <span className="field-tag text-white/50 mb-3 block">Your property</span>
 <h1 className="narrative text-white text-5xl md:text-7xl mb-3">{home.name}</h1>
 <p className="text-white/65 flex items-center gap-2">
 <MapPin className="w-4 h-4" /> {home.address || "No address provided"}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="grid md:grid-cols-3 gap-12 md:gap-16">
 {/* Zones */}
 <div className="md:col-span-2">
 <div className="flex items-center justify-between mb-8">
 <div>
 <p className="field-tag text-muted-foreground mb-2">Layout</p>
 <h2 className="text-2xl font-semibold tracking-tight">Zones</h2>
 </div>
 <Button onClick={() => navigate(`/properties/${home.id}/rooms/new`)}>
 <Plus className="w-4 h-4 mr-2" /> Add Zone
 </Button>
 </div>

 {visibleRooms.length === 0 ? (
 <div className="border-t border-b border-border py-16 text-center">
 <p className="font-medium mb-2">No zones configured</p>
 <p className="text-muted-foreground text-sm mb-6">Add rooms to this property to begin scanning for hazards.</p>
 <Button onClick={() => navigate(`/properties/${home.id}/rooms/new`)} variant="outline">Add First Zone</Button>
 </div>
 ) : (
 <div className="border-t border-border">
 {visibleRooms.map((room, idx) => (
 <motion.div
 key={room.id}
 initial={{ opacity: 0, y: 8 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: idx * 0.05, duration: 0.4 }}
 onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}`)}
 className="group cursor-pointer flex items-center gap-5 py-5 border-b border-border"
 >
 <div className="w-20 h-20 shrink-0 overflow-hidden bg-muted relative">
 {room.images?.[0]?.url ? (
 <img src={room.images[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <span className="tabular text-brand text-lg">{String(idx + 1).padStart(2, "0")}</span>
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-lg tracking-tight group-hover:text-brand transition-colors">{room.name}</h3>
 <p className="text-sm text-muted-foreground capitalize mt-0.5">{room.type}</p>
 </div>
 <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
 </motion.div>
 ))}
 </div>
 )}
 </div>

 {/* Details */}
 <div>
 <p className="field-tag text-muted-foreground mb-6">Details</p>
 <dl className="space-y-5 border-t border-border pt-6">
 <div>
 <dt className="text-muted-foreground text-xs uppercase tracking-widest mb-1.5">Property nickname</dt>
 <dd className="font-medium text-base">{home.nickname || "—"}</dd>
 </div>
 <div className="pt-5 border-t border-border">
 <dt className="text-muted-foreground text-xs uppercase tracking-widest mb-1.5">Added on</dt>
 <dd className="font-medium text-base">{format(home.createdAt, 'MMMM d, yyyy')}</dd>
 </div>
 <div className="pt-5 border-t border-border">
 <dt className="text-muted-foreground text-xs uppercase tracking-widest mb-1.5">Total zones</dt>
 <dd className="font-medium text-base">{visibleRooms.length}</dd>
 </div>
 </dl>
 </div>
 </div>
 </div>
 );
}
