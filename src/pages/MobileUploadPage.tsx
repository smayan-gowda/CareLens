import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  X, 
  Smartphone, 
  Sparkles, 
  ArrowLeft,
  Layers,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHomeStore } from "@/stores/useHomeStore";
import { useStagingStore } from "@/stores/useStagingStore";
import { RoomType } from "@/types/home";
import { LensMark } from "@/components/brand/LensMark";

const ROOM_OPTIONS: { type: RoomType; label: string; placeholder: string; noteHint: string }[] = [
  { type: "bathroom", label: "Bathroom", placeholder: "e.g. Shower entrance & floor mat", noteHint: "Note floor surfaces, grab bar availability, or threshold transitions" },
  { type: "bedroom", label: "Bedroom", placeholder: "e.g. Bedside pathway & rug", noteHint: "Note path lighting, loose cords, or bed height" },
  { type: "kitchen", label: "Kitchen", placeholder: "e.g. Preparation counter & cabinets", noteHint: "Note cabinet reaching height, floor mats, or lighting" },
  { type: "living", label: "Living Room", placeholder: "e.g. Walking lane around seating", noteHint: "Note table corners, seating support, or trailing wires" },
  { type: "hallway", label: "Hallway", placeholder: "e.g. Main corridor pathway", noteHint: "Note passage clearance, runner rugs, or night lights" },
  { type: "staircase", label: "Staircase", placeholder: "e.g. Stair steps & handrails", noteHint: "Note handrail coverage, step edge contrast, or lighting" },
  { type: "entryway", label: "Entryway", placeholder: "e.g. Threshold & entrance floor", noteHint: "Note door threshold lip, floor mats, or entryway lighting" },
  { type: "dining", label: "Dining Room", placeholder: "e.g. Seating clearance & floor", noteHint: "Note chair stability, armrests, or rug edges" },
  { type: "laundry", label: "Laundry", placeholder: "e.g. Washer area transition", noteHint: "Note storage reach, floor surface, or thresholds" },
  { type: "garage", label: "Garage / Ramp", placeholder: "e.g. Interior step into house", noteHint: "Note handrails, lighting, or floor level changes" },
  { type: "custom", label: "Other", placeholder: "e.g. Porch transition", noteHint: "Note any specific mobility or fall risk observation" }
];

export function MobileUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { homes } = useHomeStore();
  const { addPhoto } = useStagingStore();

  const paramHomeId = searchParams.get("homeId") || homes[0]?.id || "";
  const paramRoomType = (searchParams.get("roomType") as RoomType) || "bathroom";

  const [selectedHomeId, setSelectedHomeId] = useState<string>(paramHomeId);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>(paramRoomType);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedSuccess, setUploadedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentRoomConfig = ROOM_OPTIONS.find((r) => r.type === selectedRoomType) || ROOM_OPTIONS[0];

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);

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
      await addPhoto(user.uid, {
        fileOrUrl: file || preview!,
        homeId: selectedHomeId || homes[0]?.id || "default",
        roomType: selectedRoomType,
        title: title.trim() || `${currentRoomConfig.label} Photo`,
        notes: notes.trim(),
        capturedFrom: "mobile"
      });

      setUploadedSuccess(true);
      toast.success("Photo synced to your computer vault!");
    } catch (err: any) {
      console.error("Failed to stage photo:", err);
      toast.error(err?.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12 pt-4 px-4 max-w-lg mx-auto">
      {/* Mobile Top Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-2.5">
          <LensMark className="w-5 h-5 text-brand" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight leading-none text-foreground">CareLens Mobile</h2>
            <span className="text-[10px] text-muted-foreground">Mobile Photo Staging</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/vault")}
          className="text-xs h-8 text-muted-foreground hover:text-foreground"
        >
          View Vault <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Cloud Sync Status Card */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-foreground">Computer Sync Active</span>
        </div>
        <span className="text-muted-foreground text-[11px]">Instant live sync</span>
      </div>

      {uploadedSuccess ? (
        <div className="py-8 text-center space-y-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Synced to Your Computer!</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              "{title || currentRoomConfig.label}" has been uploaded and is immediately visible on your computer screen in the Staging Vault.
            </p>
          </div>

          {preview && (
            <div className="w-40 h-28 rounded-xl overflow-hidden border border-border mx-auto shadow-sm">
              <img src={preview} alt="Staged" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <Button
              type="button"
              className="w-full text-xs h-10.5 bg-brand text-brand-foreground hover:brightness-105"
              onClick={handleReset}
            >
              <Camera className="w-4 h-4 mr-2" /> Snap Another Room Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs h-10.5 border-border"
              onClick={() => navigate("/vault")}
            >
              Go to Photo Vault
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Capture Area */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">1. Capture Room Photo</Label>
            
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5 aspect-4/3 flex items-center justify-center shadow-xs">
                <img src={preview} alt="Room" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2.5 left-3 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded-md backdrop-blur-xs font-medium">
                  Photo captured
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Large primary mobile shutter button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-brand/40 bg-brand/5 hover:bg-brand/10 transition-all flex flex-col items-center justify-center gap-3 text-center active:scale-[0.99]"
                >
                  <div className="w-14 h-14 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Tap to Take Photo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Opens your phone's back camera
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground"
                >
                  <Upload className="w-4 h-4" /> Or choose from photo album
                </button>
              </div>
            )}

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

          {/* Room Category Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">2. Room Category</Label>
            <div className="grid grid-cols-3 gap-1.5 p-1 border border-border/80 rounded-xl bg-card">
              {ROOM_OPTIONS.map((opt) => {
                const isSelected = selectedRoomType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedRoomType(opt.type);
                      if (!title || ROOM_OPTIONS.some(r => title.startsWith(r.label))) {
                        setTitle(`${opt.label} Snapshot`);
                      }
                    }}
                    className={`text-center text-xs py-2 px-1 rounded-lg font-medium transition-all truncate ${
                      isSelected
                        ? "bg-brand text-brand-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Label / Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">3. Photo Title / Label</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={currentRoomConfig.placeholder}
              className="h-10 text-xs bg-card"
              maxLength={100}
              required
            />
          </div>

          {/* Observation Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">4. Safety Notes (Optional)</Label>
              <span className="text-[11px] text-muted-foreground">What did you notice?</span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={currentRoomConfig.noteHint}
              className="text-xs resize-none h-20 bg-card"
              maxLength={400}
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={uploading || (!file && !preview)}
              className="w-full text-xs h-11 bg-brand text-brand-foreground hover:brightness-105 font-medium shadow-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compressing & Uploading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Save & Sync to Computer
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
