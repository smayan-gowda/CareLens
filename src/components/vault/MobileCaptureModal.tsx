import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  X, 
  Sparkles, 
  Home as HomeIcon,
  Layers,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHomeStore } from "@/stores/useHomeStore";
import { useStagingStore } from "@/stores/useStagingStore";
import { RoomType } from "@/types/home";

const ROOM_OPTIONS: { type: RoomType; label: string; placeholder: string; noteHint: string }[] = [
  { type: "bathroom", label: "Bathroom", placeholder: "e.g. Shower curb & floor mat", noteHint: "Note any slick tiles, missing grab bars, or steep tub rims" },
  { type: "bedroom", label: "Bedroom", placeholder: "e.g. Bedside pathway & rug", noteHint: "Note low nightstand lighting, loose cords, or tall bed height" },
  { type: "kitchen", label: "Kitchen", placeholder: "e.g. Stove front & cabinet reach", noteHint: "Note overhead cabinet heights, anti-fatigue mats, or spills" },
  { type: "living", label: "Living Room", placeholder: "e.g. Coffee table walking lane", noteHint: "Note coffee table corners, low couches, or trailing wires" },
  { type: "hallway", label: "Hallway", placeholder: "e.g. Main corridor to bathroom", noteHint: "Note narrow turns, runner rugs, or night light coverage" },
  { type: "staircase", label: "Staircase", placeholder: "e.g. Top flight & handrail", noteHint: "Note handrail stability, step edge visibility, or glare" },
  { type: "entryway", label: "Entryway / Foyer", placeholder: "e.g. Front threshold & mat", noteHint: "Note door threshold lip, shoe clutter, or weather mats" },
  { type: "dining", label: "Dining Room", placeholder: "e.g. Chair clearance & floor", noteHint: "Note chair stability with armrests, rug edges" },
  { type: "laundry", label: "Laundry Room", placeholder: "e.g. Washer doorway transition", noteHint: "Note detergent reach, floor water risks, or thresholds" },
  { type: "garage", label: "Garage / Ramp", placeholder: "e.g. Interior step into house", noteHint: "Note handrails, lighting, or floor level changes" },
  { type: "custom", label: "Other / General", placeholder: "e.g. Porch transition", noteHint: "Note any specific mobility or fall risk observation" }
];

interface MobileCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHomeId?: string;
  defaultRoomType?: RoomType;
  onSuccess?: (photoId: string) => void;
}

export function MobileCaptureModal({
  open,
  onOpenChange,
  defaultHomeId,
  defaultRoomType = "bathroom",
  onSuccess
}: MobileCaptureModalProps) {
  const { user } = useAuthStore();
  const { homes } = useHomeStore();
  const { addPhoto } = useStagingStore();

  const [selectedHomeId, setSelectedHomeId] = useState<string>(defaultHomeId || homes[0]?.id || "");
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>(defaultRoomType);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedSuccess, setUploadedSuccess] = useState(false);
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultHomeId) setSelectedHomeId(defaultHomeId);
    if (defaultRoomType) setSelectedRoomType(defaultRoomType);
  }, [defaultHomeId, defaultRoomType]);

  const currentRoomConfig = ROOM_OPTIONS.find((r) => r.type === selectedRoomType) || ROOM_OPTIONS[0];

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);

    // Auto-populate title if empty
    if (!title) {
      setTitle(`${currentRoomConfig.label} Area Snapshot`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setNotes("");
    setUploadedSuccess(false);
    setLastUploadedId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to stage photos");
      return;
    }
    if (!file && !preview) {
      toast.error("Please snap or upload a room photo first");
      return;
    }

    try {
      setUploading(true);
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      
      const newPhotoId = await addPhoto(user.uid, {
        fileOrUrl: file || preview!,
        homeId: selectedHomeId || homes[0]?.id || "default",
        roomType: selectedRoomType,
        title: title.trim() || `${currentRoomConfig.label} Photo`,
        notes: notes.trim(),
        capturedFrom: isMobile ? "mobile" : "desktop"
      });

      setLastUploadedId(newPhotoId);
      setUploadedSuccess(true);
      toast.success("Photo staged successfully! It is now ready for scanning.");
      if (onSuccess) onSuccess(newPhotoId);
    } catch (err: any) {
      console.error("Failed to stage photo:", err);
      toast.error(err?.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-medium tracking-tight">
            {uploadedSuccess ? "Photo Staged & Synced" : "Stage Room Photo"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {uploadedSuccess 
              ? "Your photo has been saved to the vault and is instantly accessible on desktop." 
              : "Capture a room on your phone or computer, label the area, and inspect it anytime."}
          </DialogDescription>
        </DialogHeader>

        {uploadedSuccess ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="text-base font-semibold text-foreground">Ready for AI Assessment</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "{title || currentRoomConfig.label}" is saved in your Photo Vault. You can scan it right now or take more photos first.
              </p>
            </div>

            {preview && (
              <div className="w-32 h-24 rounded-lg overflow-hidden border border-border mx-auto shadow-sm">
                <img src={preview} alt="Staged room" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs h-10"
                onClick={handleReset}
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Take Another Photo
              </Button>
              <Button
                type="button"
                className="flex-1 text-xs h-10 bg-brand text-brand-foreground hover:brightness-105"
                onClick={() => onOpenChange(false)}
              >
                Finish & View Vault <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {/* Image Capture Zone */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Room Photo</Label>
              
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-black/5 aspect-video flex items-center justify-center group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-md hover:bg-background transition-all"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2.5 bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-md backdrop-blur-sm">
                    Ready to stage
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Camera button specifically for mobile */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-border hover:border-brand hover:bg-brand/5 transition-all text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">Snap with Camera</span>
                      <span className="text-[10px] text-muted-foreground">Mobile shutter</span>
                    </div>
                  </button>

                  {/* Upload button for gallery */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-border hover:border-brand hover:bg-brand/5 transition-all text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">Choose from Album</span>
                      <span className="text-[10px] text-muted-foreground">Photos & files</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* Target Property */}
            {homes.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Property</Label>
                <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select home" />
                  </SelectTrigger>
                  <SelectContent>
                    {homes.map((h) => (
                      <SelectItem key={h.id} value={h.id} className="text-xs">
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Room Type Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Room Category</Label>
                <span className="text-[11px] text-muted-foreground">{currentRoomConfig.label}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 border border-border/80 rounded-lg bg-muted/20">
                {ROOM_OPTIONS.map((opt) => {
                  const isSelected = selectedRoomType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        setSelectedRoomType(opt.type);
                        if (!title || ROOM_OPTIONS.some(r => title.startsWith(r.label))) {
                          setTitle(`${opt.label} Area Snapshot`);
                        }
                      }}
                      className={`text-left text-[11px] px-2.5 py-2 rounded-md transition-all truncate font-medium ${
                        isSelected 
                          ? "bg-brand text-brand-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Photo Title / Label</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={currentRoomConfig.placeholder}
                className="h-9 text-xs"
                maxLength={100}
                required
              />
            </div>

            {/* Observation Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Safety Notes & Observations (Optional)</Label>
                <span className="text-[10px] text-muted-foreground/80">Helps guide audit</span>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={currentRoomConfig.noteHint}
                className="text-xs resize-none h-18"
                maxLength={400}
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs h-9.5"
                onClick={() => onOpenChange(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || (!file && !preview)}
                className="flex-1 text-xs h-9.5 bg-brand text-brand-foreground hover:brightness-105"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Save to Vault
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
