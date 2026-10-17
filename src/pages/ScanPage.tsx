import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Camera, Video } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { analysisService } from "@/services/ai/analysisService";
import { motion, AnimatePresence } from "motion/react";
import { AnalysisWorkspace } from "@/components/scan/AnalysisWorkspace";
import { LiveWalkthrough } from "@/components/scan/LiveWalkthrough";
import type { ScanResult } from "@/types/ai";

import { processImageForStorage } from "@/services/storageService";

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
  const [isLiveWalkthroughOpen, setIsLiveWalkthroughOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const currentHome = visibleHomes.find(h => h.id === selectedHomeId);
  const currentRoom = currentHome?.rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (!selectedHomeId && visibleHomes.length === 1) {
      setSelectedHomeId(visibleHomes[0].id);
    }
  }, [selectedHomeId, homes]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const photoUrl = await processImageForStorage(selectedFile);
      setPreview(photoUrl);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      const photoUrl = await processImageForStorage(selectedFile);
      setPreview(photoUrl);
    }
  };

 const handleAnalyze = () => {
 if (!user) return toast.error("Please login first");
 if (!file) return toast.error("Please select an image");
 if (!selectedHomeId) return toast.error("Please select a property");
 if (!selectedRoomId) return toast.error("Please select a room");

 setIsAnalyzing(true);
 };

 const runAnalysis = () => analysisService.analyzeRoom(selectedHomeId, selectedRoomId, [preview!]);

 const handleAnalysisDone = async (result: ScanResult) => {
 try {
 await addScan(user!.uid, selectedRoomId, result);
 toast.success("Analysis complete");
 navigate(`/assessments`);
 } catch (error) {
 console.error(error);
 toast.error("Couldn't save this report. Please try again.");
 setIsAnalyzing(false);
 }
 };

 const handleAnalysisError = (error: any) => {
 console.error(error);
 const message = error?.message || "Analysis failed. Please try again.";
 toast.error(message, { duration: 5000 });
 setIsAnalyzing(false);
 };

 if (isAnalyzing) {
 return (
 <AnalysisWorkspace
 previewUrl={preview!}
 run={runAnalysis}
 onDone={handleAnalysisDone}
 onError={handleAnalysisError}
 />
 );
 }

 return (
 <div className="space-y-16">
 {isLiveWalkthroughOpen && (
 <LiveWalkthrough onClose={() => setIsLiveWalkthroughOpen(false)} />
 )}
 <div className="text-center space-y-5 max-w-2xl mx-auto">
 <p className="field-tag text-muted-foreground">New assessment</p>
 <h1 className="narrative text-5xl md:text-6xl">A closer look at a room.</h1>
 <p className="text-xl text-muted-foreground leading-relaxed">
 A photo of the room is all we need — we'll take it from there.
 </p>
 </div>

 <div className="grid md:grid-cols-12 gap-8 md:gap-12">
 
 {/* Settings Sidebar */}
 <div className="md:col-span-4 space-y-8">
 <div className="border-t border-border pt-8">
 <p className="field-tag text-muted-foreground mb-6">Which room?</p>
 
 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">Property</label>
 <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
 <SelectTrigger className="h-14 w-full bg-muted/50 border-transparent focus:border-border rounded-md transition-all shadow-none text-base">
 <span className="flex flex-1 text-left truncate">
 {currentHome?.name || "Select Property"}
 </span>
 </SelectTrigger>
 <SelectContent className="rounded-md border border-border shadow-xl">
 {visibleHomes.map((home) => (
 <SelectItem key={home.id} value={home.id} className="rounded-md py-3 cursor-pointer">
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
 <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">Room</label>
 <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
 <SelectTrigger className="h-14 w-full bg-muted/50 border-transparent focus:border-border rounded-md transition-all shadow-none text-base">
 <span className="flex flex-1 text-left truncate">
 {currentRoom?.name || "Select Room"}
 </span>
 </SelectTrigger>
 <SelectContent className="rounded-md border border-border shadow-xl">
 {currentHome?.rooms.filter(r => !hiddenRooms.includes(r.id)).map((room) => (
 <SelectItem key={room.id} value={room.id} className="rounded-md py-3 cursor-pointer">
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
 <motion.div
 key="upload"
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
 className="grid md:grid-cols-2 gap-4 w-full h-full min-h-[400px]"
 >
 <label
 onDragOver={(e) => e.preventDefault()}
 onDrop={handleDrop}
 className="flex flex-col items-center justify-center w-full h-full border border-dashed border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer group rounded-lg p-6"
 >
 <div className="w-16 h-16 border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-300 mb-6 rounded-md">
 <Camera className="w-6 h-6 text-muted-foreground group-hover:text-background transition-colors" strokeWidth={1.5} />
 </div>
 <h3 className="text-xl font-semibold tracking-tight mb-2">Static Photo</h3>
 <p className="text-muted-foreground text-sm max-w-[180px] text-center">
 Upload or snap a single picture to scan for hazards.
 </p>
 <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
 </label>
 
 <div 
 onClick={() => setIsLiveWalkthroughOpen(true)}
 className="flex flex-col items-center justify-center w-full h-full border border-border bg-brand/5 hover:bg-brand/10 transition-colors cursor-pointer group rounded-lg p-6"
 >
 <div className="w-16 h-16 border border-brand/20 bg-brand/10 flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors duration-300 mb-6 rounded-md">
 <Video className="w-6 h-6 text-brand group-hover:text-brand-foreground transition-colors" strokeWidth={1.5} />
 </div>
 <h3 className="text-xl font-semibold tracking-tight mb-2 text-brand">Live Walkthrough</h3>
 <p className="text-brand/70 text-sm max-w-[180px] text-center">
 Real-time AI voice guidance as you walk the room.
 </p>
 </div>
 </motion.div>
 ) : (
 <motion.div
 key="preview"
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
 className="relative w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden bg-black border border-border brackets text-white/30"
 >
 <div className="bracket-tl" /><div className="bracket-br" />
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
 className="bg-black/40 border-white/20 text-white hover:bg-black/70 backdrop-blur-md"
 >
 <X className="w-4 h-4" />
 </Button>
 </div>

 <div className="absolute bottom-8 left-8 right-8">
 <Button 
 variant="brand"
 size="lg"
 onClick={handleAnalyze}
 disabled={!selectedHomeId || !selectedRoomId}
 className="w-full h-14 text-base"
 >
 Take a Look
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
