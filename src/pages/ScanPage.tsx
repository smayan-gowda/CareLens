import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Camera, Video, Smartphone, Sparkles, Layers, ChevronRight, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useStagingStore } from "@/stores/useStagingStore";
import { analysisService } from "@/services/ai/analysisService";
import { motion, AnimatePresence } from "motion/react";
import { AnalysisWorkspace } from "@/components/scan/AnalysisWorkspace";
import { LiveWalkthrough } from "@/components/scan/LiveWalkthrough";
import { QrHandoffModal } from "@/components/vault/QrHandoffModal";
import type { ScanResult } from "@/types/ai";
import { StagedPhoto } from "@/types/home";

import { processImageForStorage } from "@/services/storageService";

export function ScanPage() {
  const { homeId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { homes, hiddenHomes, hiddenRooms } = useHomeStore();
  const visibleHomes = homes.filter(h => !hiddenHomes.includes(h.id));
  const { addScan } = useScanStore();
  const { photos: stagedPhotos, markScanned } = useStagingStore();

  const paramStagedId = searchParams.get("stagedId");
  const paramHomeId = searchParams.get("homeId");
  const paramRoomType = searchParams.get("roomType");
  
  const [selectedHomeId, setSelectedHomeId] = useState<string>(homeId || paramHomeId || "");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomId || "");
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStagedPhoto, setSelectedStagedPhoto] = useState<StagedPhoto | null>(null);
  const [isLiveWalkthroughOpen, setIsLiveWalkthroughOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const currentHome = visibleHomes.find(h => h.id === selectedHomeId);
  const currentRoom = currentHome?.rooms.find(r => r.id === selectedRoomId);

  // Unscanned staged photos available for quick selection
  const unscannedStagedPhotos = useMemo(() => {
    return stagedPhotos.filter(p => p.status === "unscanned");
  }, [stagedPhotos]);

  // Set default home if only one exists
  useEffect(() => {
    if (!selectedHomeId && visibleHomes.length === 1) {
      setSelectedHomeId(visibleHomes[0].id);
    }
  }, [selectedHomeId, visibleHomes]);

  // Handle URL preselection from Photo Vault
  useEffect(() => {
    if (paramStagedId && stagedPhotos.length > 0) {
      const match = stagedPhotos.find(p => p.id === paramStagedId);
      if (match) {
        setSelectedStagedPhoto(match);
        setPreview(match.imageUrl);
        if (match.homeId && (!selectedHomeId || selectedHomeId !== match.homeId)) {
          setSelectedHomeId(match.homeId);
        }
      }
    }
  }, [paramStagedId, stagedPhotos, selectedHomeId]);

  // Auto-match room if roomType was passed or staged photo selected
  useEffect(() => {
    if (currentHome && !selectedRoomId) {
      const targetType = selectedStagedPhoto?.roomType || paramRoomType;
      if (targetType) {
        const matchingRoom = currentHome.rooms.find(r => r.type === targetType && !hiddenRooms.includes(r.id));
        if (matchingRoom) {
          setSelectedRoomId(matchingRoom.id);
        } else if (currentHome.rooms.length > 0) {
          setSelectedRoomId(currentHome.rooms[0].id);
        }
      } else if (currentHome.rooms.length === 1) {
        setSelectedRoomId(currentHome.rooms[0].id);
      }
    }
  }, [currentHome, selectedRoomId, selectedStagedPhoto, paramRoomType, hiddenRooms]);

  const handleSelectStagedPhoto = (photo: StagedPhoto) => {
    setSelectedStagedPhoto(photo);
    setPreview(photo.imageUrl);
    setFile(null);

    // Auto-align property
    if (photo.homeId && photo.homeId !== selectedHomeId) {
      setSelectedHomeId(photo.homeId);
    }

    // Auto-align room if matching
    const homeObj = visibleHomes.find(h => h.id === (photo.homeId || selectedHomeId));
    if (homeObj) {
      const matchingRoom = homeObj.rooms.find(r => r.type === photo.roomType && !hiddenRooms.includes(r.id));
      if (matchingRoom) {
        setSelectedRoomId(matchingRoom.id);
      }
    }

    toast.info(`Loaded "${photo.title}" from staging vault`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSelectedStagedPhoto(null);
      const photoUrl = await processImageForStorage(selectedFile);
      setPreview(photoUrl);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setSelectedStagedPhoto(null);
      const photoUrl = await processImageForStorage(selectedFile);
      setPreview(photoUrl);
    }
  };

  const handleAnalyze = () => {
    if (!user) return toast.error("Please login first");
    if (!preview) return toast.error("Please select an image");
    if (!selectedHomeId) return toast.error("Please select a property");
    if (!selectedRoomId) return toast.error("Please select a room");

    setIsAnalyzing(true);
  };

  const runAnalysis = () => analysisService.analyzeRoom(selectedHomeId, selectedRoomId, [preview!]);

  const handleAnalysisDone = async (result: ScanResult) => {
    try {
      await addScan(user!.uid, selectedRoomId, result);
      
      // If this scan came from a staged photo, mark it as assessed
      if (selectedStagedPhoto) {
        await markScanned(selectedStagedPhoto.id, result.id).catch(() => {});
      }

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
    <div className="space-y-12">
      {/* Realtime QR Code handoff modal */}
      <QrHandoffModal
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
        defaultHomeId={selectedHomeId}
      />

      {isLiveWalkthroughOpen && (
        <LiveWalkthrough onClose={() => setIsLiveWalkthroughOpen(false)} />
      )}

      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <p className="field-tag text-muted-foreground">New assessment</p>
        <h1 className="narrative text-5xl md:text-6xl">A closer look at a room.</h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Take a photo with your phone or select an uploaded image — we'll take it from there.
        </p>
      </div>

      {/* Staged Photos Shelf (If user has staged photos waiting from their phone) */}
      {unscannedStagedPhotos.length > 0 && !preview && (
        <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Staged from your phone ({unscannedStagedPhotos.length} ready)
              </span>
            </div>
            <Link
              to="/vault"
              className="text-xs text-brand hover:underline font-medium flex items-center gap-1"
            >
              Manage Vault <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pt-0.5">
            {unscannedStagedPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => handleSelectStagedPhoto(photo)}
                className="shrink-0 group flex items-center gap-3 p-2 pr-3.5 rounded-lg border border-border bg-card hover:border-brand transition-all text-left shadow-xs"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                  <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-brand uppercase tracking-wider block">
                    {photo.roomType}
                  </span>
                  <span className="text-xs font-semibold text-foreground block truncate max-w-[140px]">
                    {photo.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Click to scan
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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

              {/* Cross-Device Phone Capture Quick Callout */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                <div className="flex items-center gap-2 text-foreground font-medium text-xs">
                  <Smartphone className="w-4 h-4 text-brand" />
                  <span>Snap on your phone</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Laptops can't easily photograph rooms. Scan our QR code to shoot photos on your phone and scan them here.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full text-xs h-8.5 gap-1.5"
                >
                  Open Phone QR Code
                </Button>
              </div>
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
                  <h3 className="text-xl font-semibold tracking-tight mb-2">Upload Photo</h3>
                  <p className="text-muted-foreground text-sm max-w-[190px] text-center">
                    Select a photo from this device or drop a file here.
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
                  <p className="text-brand/70 text-sm max-w-[190px] text-center">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                
                {/* Active photo info tag */}
                {selectedStagedPhoto && (
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-brand" />
                    <span className="font-semibold">{selectedStagedPhoto.title}</span>
                    <span className="text-white/60">({selectedStagedPhoto.roomType})</span>
                  </div>
                )}

                <div className="absolute top-6 right-6 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setSelectedStagedPhoto(null);
                    }}
                    className="bg-black/40 border-white/20 text-white hover:bg-black/70 backdrop-blur-md"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute bottom-8 left-8 right-8 space-y-2">
                  {selectedStagedPhoto?.notes && (
                    <p className="text-xs text-white/80 bg-black/40 backdrop-blur-sm p-2 rounded-md border border-white/10 line-clamp-1">
                      <span className="text-white font-medium">Notes: </span>{selectedStagedPhoto.notes}
                    </p>
                  )}
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
