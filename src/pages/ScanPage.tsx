import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, FileImage, X, Loader2, Sparkles, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
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
  
  const [files, setFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("");

  const currentHome = visibleHomes.find(h => h.id === selectedHomeId);
  const currentRoom = currentHome?.rooms.find(r => r.id === selectedRoomId);

  // If we came in via the global route and there's only 1 home, preselect it
  useEffect(() => {
    if (!selectedHomeId && visibleHomes.length === 1) {
      setSelectedHomeId(visibleHomes[0].id);
    }
  }, [selectedHomeId, homes]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateScan = async () => {
    if (!user) {
      toast.error("You must be logged in to perform a scan");
      return;
    }

    if ((files.length === 0 && (!currentRoom || currentRoom.images.length === 0)) || !selectedHomeId || !selectedRoomId) {
      toast.error("Please provide images and select a room.");
      return;
    }
    
    setIsScanning(true);
    setProgress(0);
    setStageMessage("Initializing AI core...");
    
    const imageList = files.length > 0 
      ? files.map(f => URL.createObjectURL(f)) 
      : currentRoom?.images.map(img => img.url) || [];

    try {
      const scanResult = await analysisService.analyzeRoom(
        selectedHomeId,
        selectedRoomId,
        imageList,
        (stage, prog) => {
          setProgress(prog);
          const messages = [
            "Uploading image...",
            "Understanding room layout...",
            "Detecting objects...",
            "Analyzing safety risks...",
            "Generating recommendations...",
            "Complete"
          ];
          setStageMessage(messages[stage - 1] || "Processing...");
        }
      );
      
      await addScan(user.uid, selectedRoomId, {
        ...scanResult,
        homeId: selectedHomeId
      });
      
      // Add activity
      const { addActivity, addTimelineEvent, addNotification } = useHomeStore.getState();
      await addActivity(user.uid, {
        homeId: selectedHomeId,
        action: 'Safety Scan',
        description: `Performed a safety scan of ${currentRoom?.name || 'a room'}`,
        scanId: scanResult.id,
      });

      await addTimelineEvent(user.uid, {
        homeId: selectedHomeId,
        type: 'scan',
        title: `Safety Scan: ${currentRoom?.name || 'Room'}`,
        description: `Completed AI analysis of ${currentRoom?.name || 'the room'}. Found ${scanResult.hazards.length} potential hazards.`,
        scoreChange: { from: 0, to: scanResult.safetyScore },
        details: [
          `Detected ${scanResult.hazards.length} hazards`,
          `Generated ${scanResult.recommendations.length} safety recommendations`,
          `Initial safety score: ${scanResult.safetyScore}/100`
        ],
        link: `/homes/${selectedHomeId}/rooms/${selectedRoomId}/reports/${scanResult.id}`,
        scanId: scanResult.id,
      });

      await addNotification(user.uid, {
        type: 'report',
        title: 'New Scan Complete',
        message: `Your ${currentRoom?.name || 'room'} safety report is ready for viewing.`,
        link: `/homes/${selectedHomeId}/rooms/${selectedRoomId}/reports/${scanResult.id}`,
        scanId: scanResult.id,
      });

      toast.success("Analysis complete!");
      
      // Navigate to report
      setTimeout(() => {
        navigate(`/homes/${selectedHomeId}/rooms/${selectedRoomId}/reports/${scanResult.id}`);
      }, 500);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "Unable to confidently analyze this image. Try taking a brighter photo showing more of the room.";
      toast.error(errorMsg, {
        description: "Please check your image quality and try again.",
        duration: 5000,
      });
      setIsScanning(false);
    }
  };

  if (isScanning) {
    return (
      <div className="max-w-2xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="h-24 w-24 bg-background border-2 border-primary rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-primary/20">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        
        <div className="text-center space-y-2 w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground/90">Analyzing {currentRoom?.name || 'Room'}</h2>
          <p className="text-muted-foreground h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={stageMessage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {stageMessage}
              </motion.span>
            </AnimatePresence>
          </p>
          <div className="pt-4">
            <Progress value={progress} className="h-2 w-full bg-primary/10" />
          </div>
          <p className="text-xs text-muted-foreground pt-2 font-medium">{Math.round(progress)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Safety Scan</h1>
        <p className="text-muted-foreground mt-1">Harness advanced computer vision to identify fall risks and accessibility barriers.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Room Images</CardTitle>
              <CardDescription>Upload photos of the room for analysis. Ensure good lighting and clear views of the floor.</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all hover:bg-muted/40 hover:border-primary/50 cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="bg-primary/5 p-4 rounded-full mb-4 ring-1 ring-primary/10">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Select or drag images</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Upload multiple photos for a comprehensive analysis</p>
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((file, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border bg-muted/30 aspect-square">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                             <X className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {files.length === 0 && currentRoom && currentRoom.images.length > 0 && (
                <div className="mt-6 p-4 border rounded-lg bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Using existing room photos</h4>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                        We'll analyze the {currentRoom.images.length} photo(s) already uploaded to {currentRoom.name}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Scan Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Home</label>
                <Select value={selectedHomeId} onValueChange={(val) => { setSelectedHomeId(val); setSelectedRoomId(""); }} disabled={!!homeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a home">
                      {selectedHomeId ? visibleHomes.find(h => h.id === selectedHomeId)?.name : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {visibleHomes.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedHomeId && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <label className="text-sm font-medium">Room</label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId} disabled={!!roomId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room">
                        {selectedRoomId ? visibleHomes.find(h => h.id === selectedHomeId)?.rooms.find(r => r.id === selectedRoomId)?.name : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {visibleHomes.find(h => h.id === selectedHomeId)?.rooms.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm mb-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Estimated time: 30 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Identifies over 50 hazard types</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Secure & private analysis</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 text-base font-medium shadow-sm" 
                onClick={simulateScan}
                disabled={(!selectedHomeId || !selectedRoomId) || (files.length === 0 && (!currentRoom || currentRoom.images.length === 0))}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Begin AI Safety Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
