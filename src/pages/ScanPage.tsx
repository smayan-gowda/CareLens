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
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-64 h-64 flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-card shadow-2xl border border-black/10 dark:border-white/10"
        >
           {preview && (
             <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" />
           )}
           <motion.div 
             animate={{ y: ["-100%", "100%"] }} 
             transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
             className="absolute inset-0 h-full w-full border-b-[3px] border-emerald-500 bg-gradient-to-t from-emerald-500/20 to-transparent z-20"
           />
           <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-20 h-20 bg-background/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/5 shadow-lg">
                <ScanLine className="w-8 h-8 text-foreground animate-pulse" />
              </div>
           </div>
        </motion.div>
        
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="mt-16 text-center"
        >
           <h2 className="text-3xl font-medium tracking-tight mb-3">Analyzing Environment</h2>
           <p className="text-muted-foreground max-w-sm mx-auto font-light leading-relaxed">
             Our computer vision model is detecting structural hazards, trip risks, and accessibility issues.
           </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-16 pt-8">
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight">Environmental Assessment</h1>
        <p className="text-xl text-muted-foreground font-light leading-relaxed">
          Upload or capture a wide-angle photo of the space to begin a professional safety inspection.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 md:gap-12">
        
        {/* Settings Sidebar */}
        <div className="md:col-span-4 space-y-8">
          <div className="bg-card rounded-[2rem] p-8 border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)]">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Target className="w-5 h-5 text-foreground" />
                </div>
                <h2 className="text-xl font-medium tracking-tight">Context</h2>
             </div>
             
             <div className="space-y-6">
               <div className="space-y-3">
                 <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">Target Property</label>
                 <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                   <SelectTrigger className="h-14 w-full bg-muted/50 border-transparent focus:border-border rounded-2xl transition-all shadow-none text-base">
                     <span className="flex flex-1 text-left truncate">
                       {currentHome?.name || "Select Property"}
                     </span>
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border border-border shadow-xl">
                     {visibleHomes.map((home) => (
                       <SelectItem key={home.id} value={home.id} className="rounded-xl py-3 cursor-pointer">
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
                   className="space-y-3"
                 >
                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">Target Zone</label>
                   <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                     <SelectTrigger className="h-14 w-full bg-muted/50 border-transparent focus:border-border rounded-2xl transition-all shadow-none text-base">
                       <span className="flex flex-1 text-left truncate">
                         {currentRoom?.name || "Select Room"}
                       </span>
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border border-border shadow-xl">
                       {currentHome?.rooms.filter(r => !hiddenRooms.includes(r.id)).map((room) => (
                         <SelectItem key={room.id} value={room.id} className="rounded-xl py-3 cursor-pointer">
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
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.label
                key="upload"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center w-full aspect-[4/3] md:aspect-[3/2] rounded-[2.5rem] border border-dashed border-border bg-card hover:bg-muted/40 transition-all cursor-pointer group shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
              >
                <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-foreground group-hover:text-background transition-all duration-500 mb-8 border border-black/5 dark:border-white/5">
                  <Camera className="w-10 h-10 text-muted-foreground group-hover:text-background transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-medium tracking-tight mb-3">Capture or Upload</h3>
                <p className="text-neutral-500 text-sm max-w-[200px] text-center">
                  Drag and drop a clear photo of the room here.
                </p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </motion.label>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full aspect-[4/3] md:aspect-[3/2] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-black/5 dark:border-white/5"
              >
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                
                <div className="absolute top-6 right-6 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="rounded-full bg-black/40 border-white/20 text-white hover:bg-black/80 backdrop-blur-md"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                   <Button 
                     onClick={handleAnalyze}
                     disabled={!selectedHomeId || !selectedRoomId}
                     className="w-full h-16 rounded-[1.5rem] bg-white text-black hover:bg-neutral-100 text-lg font-medium shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
