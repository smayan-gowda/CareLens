import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Camera, 
  Video, 
  Smartphone, 
  Sparkles, 
  ChevronRight, 
  Award, 
  BookOpen, 
  Info, 
  CheckCircle2, 
  Trash2,
  Compass,
  Ruler
} from "lucide-react";
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
import { SAMPLE_ASSESSMENTS } from "@/data/sampleAssessments";
import { analyzeSpatialRelationships } from "@/services/ai/spatialAnalyzer";
import { processImageForStorage } from "@/services/storageService";

export function ScanPage() {
  const { homeId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { homes, hiddenHomes, hiddenRooms } = useHomeStore();
  const visibleHomes = homes.filter((h) => !hiddenHomes.includes(h.id));
  const { addScan } = useScanStore();
  const { photos: stagedPhotos, markScanned, deletePhoto } = useStagingStore();

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
  const [showSampleSelector, setShowSampleSelector] = useState(false);

  const currentHome = visibleHomes.find((h) => h.id === selectedHomeId);
  const currentRoom = currentHome?.rooms.find((r) => r.id === selectedRoomId);

  // Match sample if preview is from a sample
  const matchingSample = useMemo(() => {
    if (!preview) return null;
    return SAMPLE_ASSESSMENTS.find((s) => s.thumbnailUrl === preview);
  }, [preview]);

  // Unscanned photos from the user's Photo Library
  const unscannedLibraryPhotos = useMemo(() => {
    return stagedPhotos.filter((p) => p.status === "unscanned");
  }, [stagedPhotos]);

  // Set default home if only one exists
  useEffect(() => {
    if (!selectedHomeId && visibleHomes.length === 1) {
      setSelectedHomeId(visibleHomes[0].id);
    }
  }, [selectedHomeId, visibleHomes]);

  // Handle URL preselection from Photo Library
  useEffect(() => {
    if (paramStagedId && stagedPhotos.length > 0) {
      const match = stagedPhotos.find((p) => p.id === paramStagedId);
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
        const matchingRoom = currentHome.rooms.find(
          (r) => r.type === targetType && !hiddenRooms.includes(r.id)
        );
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

  const handleSelectLibraryPhoto = (photo: StagedPhoto) => {
    setSelectedStagedPhoto(photo);
    setPreview(photo.imageUrl);
    setFile(null);

    if (photo.homeId && photo.homeId !== selectedHomeId) {
      setSelectedHomeId(photo.homeId);
    }

    const homeObj = visibleHomes.find((h) => h.id === (photo.homeId || selectedHomeId));
    if (homeObj) {
      const matchingRoom = homeObj.rooms.find(
        (r) => r.type === photo.roomType && !hiddenRooms.includes(r.id)
      );
      if (matchingRoom) {
        setSelectedRoomId(matchingRoom.id);
      }
    }

    toast.info(`Loaded "${photo.title}" from Photo Library`);
  };

  const handleDeleteLibraryPhoto = async (e: React.MouseEvent, photo: StagedPhoto) => {
    e.stopPropagation();
    try {
      await deletePhoto(photo.id);
      toast.success(`Removed "${photo.title}" from library`);
      if (selectedStagedPhoto?.id === photo.id) {
        setSelectedStagedPhoto(null);
        setPreview(null);
      }
    } catch {
      toast.error("Failed to remove photo");
    }
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
    if (!preview) return toast.error("Please select or upload an image");
    if (!selectedHomeId) return toast.error("Please select a property");
    if (!selectedRoomId) return toast.error("Please select a room");

    setIsAnalyzing(true);
  };

  const runAnalysis = () =>
    analysisService.analyzeRoom(selectedHomeId, selectedRoomId, [preview!]);

  const handleAnalysisDone = async (result: ScanResult) => {
    try {
      await addScan(user!.uid, selectedRoomId, result);

      if (selectedStagedPhoto) {
        await markScanned(selectedStagedPhoto.id, result.id).catch(() => {});
      }

      toast.success("Analysis complete and saved");
      navigate(`/assessments`);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save this report to storage. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisError = (error: any) => {
    console.error("Scan analysis error:", error);
    // Keep preview intact so user does not lose their image
  };

  if (isAnalyzing) {
    return (
      <AnalysisWorkspace
        previewUrl={preview!}
        roomName={currentRoom?.name || "Selected Room"}
        run={runAnalysis}
        onDone={handleAnalysisDone}
        onError={handleAnalysisError}
        onCancel={() => setIsAnalyzing(false)}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Realtime QR Code handoff modal */}
      <QrHandoffModal
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
        defaultHomeId={selectedHomeId}
      />

      {isLiveWalkthroughOpen && (
        <LiveWalkthrough 
          onClose={() => setIsLiveWalkthroughOpen(false)} 
          homeId={selectedHomeId || undefined}
          roomId={selectedRoomId || undefined}
          roomType={currentHome?.rooms.find((r) => r.id === selectedRoomId)?.type}
          onSnapshotSaved={(photoUrl) => {
            setPreview(photoUrl);
            setSelectedStagedPhoto(null);
          }}
        />
      )}

      {/* Header pill */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">

        <h1 className="narrative text-4xl md:text-5xl text-balance">
          Home Accessibility & Safety Assessment
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Upload a room photo, capture one from your phone via QR sync, or evaluate preloaded verified sample rooms.
        </p>

        {/* Dedicated "Try a Sample Assessment" button */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-brand/40 text-brand hover:bg-brand/10 cursor-pointer text-xs h-9 px-4 gap-2 font-medium"
            onClick={() => setShowSampleSelector(!showSampleSelector)}
          >
            <BookOpen className="w-4 h-4" />
            <span>{showSampleSelector ? "Hide Sample Demonstrations" : "Try a Sample Room Assessment"}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
            onClick={() => setIsQrModalOpen(true)}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Capture with Phone</span>
          </Button>
        </div>
      </div>

      {/* Preloaded Sample Assessment Cards for Judges */}
      <AnimatePresence>
        {showSampleSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-2xl bg-brand/5 border border-brand/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand" />
                    Preloaded Sample Scenarios for Evaluation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Examine full reports, verified bounding boxes, and deductive scoring formulas with real room photography.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-1">
                {SAMPLE_ASSESSMENTS.map((sample) => (
                  <div
                    key={sample.id}
                    className="p-4 rounded-xl border border-border bg-card hover:border-brand/60 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/80">
                        <img
                          src={sample.thumbnailUrl}
                          alt={sample.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">
                            {sample.roomType}
                          </span>
                          <span className="text-xs font-mono tabular font-semibold text-foreground">
                            {sample.scanResult.safetyScore} / 100 Score
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold truncate text-foreground">
                          {sample.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {sample.subtitle}
                        </p>
                        {(() => {
                          const findings = analyzeSpatialRelationships(
                            sample.scanResult.detectedObjects || []
                          );
                          return (
                            <div className="pt-2 text-xs text-muted-foreground">
                              <p className="font-medium text-foreground">
                                Spatial review: {findings.length} image-based relationship
                                {findings.length === 1 ? "" : "s"}
                              </p>
                              {findings.length > 0 && (
                                <p className="mt-1 line-clamp-2">
                                  {findings
                                    .slice(0, 2)
                                    .map((finding) => finding.objectsInvolved.join(" + "))
                                    .join(" · ")}
                                  {findings.length > 2 ? " · …" : ""}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="brand"
                        className="flex-1 text-xs h-8 cursor-pointer"
                        asChild
                      >
                        <Link to={`/reports/${sample.id}`}>
                          View Verified Sample Report <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 cursor-pointer"
                        onClick={() => {
                          setPreview(sample.thumbnailUrl);
                          setSelectedStagedPhoto(null);
                          setShowSampleSelector(false);
                          toast.info(`Loaded ${sample.name} into visual scanner`);
                        }}
                      >
                        Load Photo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Library Shelf (formerly Staging Vault) */}
      {unscannedLibraryPhotos.length > 0 && !preview && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Photo Library ({unscannedLibraryPhotos.length} ready to scan)
              </span>
            </div>
            <Link
              to="/library"
              className="text-xs text-brand hover:underline font-medium flex items-center gap-1"
            >
              Manage Photo Library <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pt-0.5">
            {unscannedLibraryPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => handleSelectLibraryPhoto(photo)}
                className="shrink-0 group flex items-center gap-3 p-2 pr-3.5 rounded-lg border border-border bg-background hover:border-brand transition-all text-left shadow-xs cursor-pointer"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-brand uppercase tracking-wider block">
                    {photo.roomType}
                  </span>
                  <span className="text-xs font-semibold text-foreground block truncate max-w-[140px]">
                    {photo.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Click to load
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteLibraryPhoto(e, photo)}
                  className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors bg-background/40 backdrop-blur-xs border border-border/50"
                  title="Remove from library"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace: Settings & Upload */}
      <div className="grid md:grid-cols-12 gap-8 md:gap-12">
        {/* Settings Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="border-t border-border pt-6">
            <p className="field-tag text-muted-foreground mb-4">Assessment Target</p>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">
                  Property
                </label>
                <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                  <SelectTrigger className="h-12 w-full bg-muted/40 border border-border rounded-lg text-sm">
                    <span className="flex flex-1 text-left truncate">
                      {currentHome?.name || "Select Property"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border shadow-xl">
                    {visibleHomes.map((home) => (
                      <SelectItem key={home.id} value={home.id} className="py-2.5 cursor-pointer">
                        {home.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedHomeId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest ml-1">
                    Room / Zone
                  </label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                    <SelectTrigger className="h-12 w-full bg-muted/40 border border-border rounded-lg text-sm">
                      <span className="flex flex-1 text-left truncate">
                        {currentRoom?.name || "Select Room"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-border shadow-xl">
                      {currentHome?.rooms
                        .filter((r) => !hiddenRooms.includes(r.id))
                        .map((room) => (
                          <SelectItem key={room.id} value={room.id} className="py-2.5 cursor-pointer">
                            {room.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {/* Preliminary disclaimer */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Info className="w-3.5 h-3.5 text-brand" />
                  <span>Assessment Guidelines</span>
                </div>
                <p className="leading-relaxed">
                  CareLens assists families in spotting visible tripping obstacles and grab bar gaps. It does not replace an in-person occupational therapy assessment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload & Workspace */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid md:grid-cols-2 gap-4 w-full h-full min-h-[360px]"
              >
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center w-full h-full border border-dashed border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer group rounded-xl p-6 text-center"
                >
                  <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-300 mb-4 rounded-lg">
                    <Camera className="w-6 h-6 text-muted-foreground group-hover:text-background" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mb-1 text-foreground">Upload Room Photo</h3>
                  <p className="text-muted-foreground text-xs max-w-[200px] leading-relaxed">
                    Select a photo from this device or drag & drop an image file here.
                  </p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>

                <div
                  onClick={() => setIsLiveWalkthroughOpen(true)}
                  className="flex flex-col items-center justify-center w-full h-full border border-brand/20 bg-brand/5 hover:bg-brand/10 transition-colors cursor-pointer group rounded-xl p-6 text-center"
                >
                  <div className="w-14 h-14 border border-brand/20 bg-brand/10 flex items-center justify-center group-hover:bg-brand group-hover:text-brand-foreground transition-colors duration-300 mb-4 rounded-lg">
                    <Video className="w-6 h-6 text-brand group-hover:text-brand-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mb-1 text-brand">Live Video Walkthrough</h3>
                  <p className="text-brand/80 text-xs max-w-[200px] leading-relaxed">
                    Real-time AI voice coaching as you walk through the room with your camera.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setSelectedStagedPhoto(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Clear Photo
                  </Button>
                </div>

                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden bg-black border border-border rounded-xl text-white"
                >
                  <img src={preview} alt="Selected room" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {selectedStagedPhoto && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-brand" />
                      <span className="font-semibold">{selectedStagedPhoto.title}</span>
                      <span className="text-white/60">({selectedStagedPhoto.roomType})</span>
                    </div>
                  )}

                  <div className="absolute bottom-6 left-6 right-6 space-y-3">
                    {selectedStagedPhoto?.notes && (
                      <p className="text-xs text-white/80 bg-black/40 backdrop-blur-sm p-2 rounded-md border border-white/10 line-clamp-1">
                        <span className="text-white font-medium">Notes: </span>
                        {selectedStagedPhoto.notes}
                      </p>
                    )}
                    <Button
                      variant="brand"
                      size="lg"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !selectedHomeId || !selectedRoomId}
                      className="w-full h-12 text-sm font-semibold cursor-pointer"
                    >
                      Run Vision Safety Assessment
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
