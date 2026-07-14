import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileImage, X, Loader2, Target, ScanLine, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { analysisService } from "@/services/ai/analysisService";
import { motion, AnimatePresence } from "motion/react";

export function ScanPage() {
  const { homeId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { homes, hiddenHomes, hiddenRooms } = useHomeStore();
  const visibleHomes = homes.filter(h => !hiddenHomes.includes(h.id));
  const { addScan } = useScanStore();
  
  const [selectedHomeId, setSelectedHomeId] = useState<string>(homeId || "");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomId || "");
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const currentHome = visibleHomes.find(h => h.id === selectedHomeId);
  const currentRoom = currentHome?.rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (!selectedHomeId && visibleHomes.length === 1) {
      setSelectedHomeId(visibleHomes[0].id);
    }
  }, [selectedHomeId, homes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = async () => {
    if (!user) return toast.error("Please login first");
    if (!file) return toast.error("Please select an image");
    if (!selectedHomeId) return toast.error("Please select a property");
    if (!selectedRoomId) return toast.error("Please select a room");

    setIsAnalyzing(true);
    
    try {
      const result = await analysisService.analyzeRoom(selectedHomeId, selectedRoomId, [preview!]);
      
      await addScan(user.uid, selectedRoomId, result);

      toast.success("Analysis complete");
      
      navigate(`/assessments`);
      
    } catch (error) {
      console.error(error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-64 h-64 flex items-center justify-center"
        >
           {preview && (
             <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-30 filter grayscale" />
           )}
           <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
             className="absolute inset-0 rounded-full border-2 border-transparent border-t-black dark:border-t-white opacity-20"
           />
           <motion.div 
             animate={{ rotate: -360 }} 
             transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
             className="absolute inset-4 rounded-full border-2 border-transparent border-b-black dark:border-b-white opacity-20"
           />
           <ScanLine className="w-12 h-12 text-black dark:text-white relative z-10" />
        </motion.div>
        
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="mt-12 text-center"
        >
           <h2 className="text-2xl font-medium tracking-tight mb-2">Analyzing Environment</h2>
           <p className="text-neutral-500 max-w-sm">
             Our computer vision model is detecting structural hazards, trip risks, and accessibility issues.
           </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Environmental Assessment</h1>
        <p className="text-sm text-muted-foreground">
          Upload or capture a wide-angle photo of the space to begin a professional safety inspection.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        
        {/* Settings Sidebar */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm space-y-6">
             <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground tracking-tight">Context</h2>
             </div>
             
             <div className="space-y-5">
               <div className="space-y-2">
                 <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Target Property</label>
                 <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                   <SelectTrigger className="h-10 w-full bg-background border-border/50 rounded-lg focus:ring-1 focus:ring-ring text-sm">
                     <span className="flex flex-1 text-left truncate">
                       {currentHome?.name || "Select Property"}
                     </span>
                   </SelectTrigger>
                   <SelectContent className="rounded-xl">
                     {visibleHomes.map((home) => (
                       <SelectItem key={home.id} value={home.id} className="rounded-lg">
                         {home.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               {selectedHomeId && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="space-y-2"
                 >
                   <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Target Zone</label>
                   <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                     <SelectTrigger className="h-10 w-full bg-background border-border/50 rounded-lg focus:ring-1 focus:ring-ring text-sm">
                       <span className="flex flex-1 text-left truncate">
                         {currentRoom?.name || "Select Room"}
                       </span>
                     </SelectTrigger>
                     <SelectContent className="rounded-lg">
                       {currentHome?.rooms.filter(r => !hiddenRooms.includes(r.id)).map((room) => (
                         <SelectItem key={room.id} value={room.id} className="rounded-md text-sm">
                           {room.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </motion.div>
               )}
             </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.label
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center w-full aspect-[4/3] rounded-2xl border border-dashed border-border/50 bg-background hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 mb-4">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium tracking-tight text-foreground mb-1">Capture or Upload</h3>
                <p className="text-muted-foreground text-xs max-w-[200px] text-center">
                  Drag and drop a clear photo of the room here.
                </p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </motion.label>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-sm"
              >
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="rounded-full bg-black/40 border-white/10 text-white hover:bg-black/60 backdrop-blur-md h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                   <Button 
                     onClick={handleAnalyze}
                     disabled={!selectedHomeId || !selectedRoomId}
                     className="w-full h-10 rounded-lg bg-white text-black hover:bg-neutral-100 text-sm font-medium transition-transform active:scale-95"
                   >
                     Begin Technical Analysis
                   </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
