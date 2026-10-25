import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  Smartphone, 
  Search, 
  Sparkles, 
  Trash2, 
  Pencil, 
  ExternalLink, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useStagingStore } from "@/stores/useStagingStore";
import { useHomeStore } from "@/stores/useHomeStore";
import { StagedPhoto, RoomType } from "@/types/home";
import { QrHandoffModal } from "@/components/vault/QrHandoffModal";
import { MobileCaptureModal } from "@/components/vault/MobileCaptureModal";
import { PhotoEditModal } from "@/components/vault/PhotoEditModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const ROOM_CATEGORIES = [
  { id: "all", label: "All Rooms" },
  { id: "bathroom", label: "Bathrooms" },
  { id: "bedroom", label: "Bedrooms" },
  { id: "kitchen", label: "Kitchens" },
  { id: "living", label: "Living Rooms" },
  { id: "hallway", label: "Hallways" },
  { id: "staircase", label: "Stairs" },
  { id: "entryway", label: "Entryways" }
];

export function PhotoVaultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { photos, deletePhoto, loading } = useStagingStore();
  const { homes } = useHomeStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "unscanned" | "scanned">("all");

  const [isQrModalOpen, setIsQrModalOpen] = useState(searchParams.get("action") === "qr");
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(searchParams.get("upload") === "mobile");
  const [editingPhoto, setEditingPhoto] = useState<StagedPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<StagedPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      // Status filter
      if (selectedStatus === "unscanned" && photo.status !== "unscanned") return false;
      if (selectedStatus === "scanned" && photo.status !== "scanned") return false;

      // Category filter
      if (selectedCategory !== "all" && photo.roomType !== selectedCategory) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = photo.title?.toLowerCase().includes(q);
        const matchesNotes = photo.notes?.toLowerCase().includes(q);
        const matchesRoom = photo.roomType?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesRoom) return false;
      }

      return true;
    });
  }, [photos, selectedStatus, selectedCategory, searchQuery]);

  const unscannedCount = useMemo(() => {
    return photos.filter((p) => p.status === "unscanned").length;
  }, [photos]);

  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return;
    const target = photoToDelete;
    try {
      setIsDeleting(true);
      await deletePhoto(target.id);
      toast.success(`Removed "${target.title}" from library`);
      setPhotoToDelete(null);
    } catch (err: any) {
      let message = "Cloud deletion failed. Photo restored to library.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) message = `Deletion failed: ${parsed.error}`;
      } catch {
        if (err?.message) message = err.message;
      }
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => {
            setPhotoToDelete(target);
          }
        }
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLaunchScan = (photo: StagedPhoto) => {
    navigate(`/scan?stagedId=${photo.id}&homeId=${photo.homeId || ""}&roomType=${photo.roomType || ""}`);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Modals */}
      <QrHandoffModal
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
      />
      <MobileCaptureModal
        open={isCaptureModalOpen}
        onOpenChange={setIsCaptureModalOpen}
      />
      <PhotoEditModal
        photo={editingPhoto}
        open={Boolean(editingPhoto)}
        onOpenChange={(open) => !open && setEditingPhoto(null)}
      />

      {/* Delete Confirmation Modal (Replaces browser window.confirm) */}
      <Dialog open={Boolean(photoToDelete)} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Remove Photo from Library?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              This photo will be removed from your staged library. You can always capture or upload another room photo at any time.
            </DialogDescription>
          </DialogHeader>

          {photoToDelete && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                <img src={photoToDelete.imageUrl} alt={photoToDelete.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-semibold text-foreground truncate">{photoToDelete.title}</p>
                <p className="text-[11px] text-brand font-medium uppercase tracking-wider">{photoToDelete.roomType}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPhotoToDelete(null)}
              disabled={isDeleting}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmDeletePhoto}
              disabled={isDeleting}
              className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isDeleting ? "Removing..." : "Delete Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-brand">Room Imagery & Storage</span>
            {unscannedCount > 0 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                • {unscannedCount} ready for AI assessment
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Photo Library
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Snap room photos on your mobile phone, organize by room type and annotate with notes, then launch detailed safety assessments on your desktop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsQrModalOpen(true)}
            className="text-xs h-9.5 gap-2 border-border shadow-xs cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-brand" />
            <span>Capture on Phone</span>
          </Button>

          <Button
            type="button"
            onClick={() => setIsCaptureModalOpen(true)}
            className="text-xs h-9.5 gap-2 bg-brand text-brand-foreground hover:brightness-105 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo</span>
          </Button>
        </div>
      </div>

      {/* Control Strip (Search, Status Filter, Category Tabs) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Segmented Tabs */}
          <div className="inline-flex p-1 rounded-lg bg-muted/50 border border-border/80 text-xs font-medium">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedStatus === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Photos ({photos.length})
            </button>
            <button
              onClick={() => setSelectedStatus("unscanned")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                selectedStatus === "unscanned"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Unscanned ({unscannedCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatus("scanned")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                selectedStatus === "scanned"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Assessed ({photos.length - unscannedCount})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels or notes..."
              className="pl-8.5 h-9 text-xs bg-card"
            />
          </div>
        </div>

        {/* Room Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {ROOM_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-xs font-medium border ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-semibold"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-muted/10 p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Camera className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-foreground">
              {photos.length === 0 ? "No photos staged yet" : "No matching photos found"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {photos.length === 0
                ? "Scan the QR code with your phone camera to snap rooms on the go, or upload photos directly from this computer."
                : "Try clearing your search query or switching category filters."}
            </p>
          </div>
          {photos.length === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQrModalOpen(true)}
                className="text-xs h-9 gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-brand" /> Scan QR on Phone
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCaptureModalOpen(true)}
                className="text-xs h-9 gap-1.5 bg-brand text-brand-foreground hover:brightness-105"
              >
                <Plus className="w-3.5 h-3.5" /> Stage First Photo
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {filteredPhotos.map((photo) => {
              const home = homes.find((h) => h.id === photo.homeId);
              const isUnscanned = photo.status === "unscanned";

              return (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setEditingPhoto(photo)}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:border-foreground/30 transition-all flex flex-col shadow-xs cursor-pointer"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-video bg-muted/40 overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Status Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      {isUnscanned ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/90 text-white backdrop-blur-xs shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Unscanned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Assessed
                        </span>
                      )}
                    </div>

                    {/* Source Device Indicator */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <div className="bg-background/90 text-foreground/80 px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                        {photo.capturedFrom === "mobile" ? (
                          <>
                            <Smartphone className="w-3 h-3 text-brand" />
                            <span>Phone</span>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-3 h-3 text-muted-foreground" />
                            <span>Desktop</span>
                          </>
                        )}
                      </div>
                      
                      {/* Delete Overlay Button - More prominent and accessible */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoToDelete(photo);
                        }}
                        className="w-8 h-8 rounded-md bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm border border-white/20 active:scale-95"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata and Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-brand uppercase tracking-wider text-[10px]">
                          {photo.roomType}
                        </span>
                        <span className="tabular text-[11px]">
                          {new Date(photo.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-brand transition-colors">
                        {photo.title}
                      </h4>

                      {photo.notes ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {photo.notes}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 italic">
                          No notes attached
                        </p>
                      )}
                    </div>

                    {/* Actions footer */}
                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPhoto(photo);
                          }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit label or notes"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoToDelete(photo);
                          }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchScan(photo);
                        }}
                        className={`text-xs h-7.5 px-3 gap-1.5 font-medium ${
                          isUnscanned 
                            ? "bg-brand text-brand-foreground hover:brightness-105" 
                            : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isUnscanned ? "Scan with AI" : "Re-Scan"}</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
