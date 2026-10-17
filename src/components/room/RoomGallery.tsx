import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, Upload, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useHomeStore } from "@/stores/useHomeStore";
import { processImageForStorage } from "@/services/storageService";
import { Button } from "@/components/ui/button";
import type { ScanResult } from "@/types/ai";
import type { RoomImage } from "@/types/home";

interface RoomGalleryProps {
  homeId?: string;
  roomId?: string;
  roomImages: RoomImage[];
  roomScans: ScanResult[];
  coverImage?: string;
}

/** A simple drag-to-reveal comparison between the earliest and latest scan
 * photo — real photos of the real room, not an illustration. */
function BeforeAfterSlider({ before, after }: { before: { url: string; date: string }; after: { url: string; date: string } }) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900 select-none">
      <img src={after.url} className="absolute inset-0 w-full h-full object-cover" alt="Most recent" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before.url} className="absolute inset-0 w-full h-full object-cover" alt="Earliest" draggable={false} />
      </div>

      <div className="absolute top-0 bottom-0 w-px bg-white/80" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div className="w-3 h-3 border-r border-l border-neutral-400" />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        aria-label="Compare before and after"
      />

      <span className="absolute bottom-4 left-4 tabular text-[10px] text-white bg-black/60 px-2 py-1 pointer-events-none">
        {format(new Date(before.date), "MMM yyyy")}
      </span>
      <span className="absolute bottom-4 right-4 tabular text-[10px] text-white bg-black/60 px-2 py-1 pointer-events-none">
        {format(new Date(after.date), "MMM yyyy")}
      </span>
    </div>
  );
}

export function RoomGallery({ homeId, roomId, roomImages, roomScans, coverImage }: RoomGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: string; url: string; date: string; isScan?: boolean } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addImage, deleteImage, updateRoom } = useHomeStore();

  const completedScans = [...roomScans]
    .filter((s) => s.status === "Completed" && (s.images?.[0] || (s as any).originalImage))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const scanPhotos = completedScans.map((s) => ({
    url: s.images?.[0] || (s as any).originalImage,
    date: s.createdAt,
    id: s.id,
    isScan: true,
  }));

  const galleryPhotos = roomImages.map((img) => ({
    url: img.url,
    date: img.uploadedAt,
    id: img.id,
    isScan: false,
  }));

  const allPhotos = [...galleryPhotos, ...scanPhotos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const canCompare = scanPhotos.length >= 2;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !homeId || !roomId) return;

    setIsUploading(true);
    const toastId = toast.loading(`Processing ${files.length} photo${files.length > 1 ? "s" : ""}...`);

    try {
      let count = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const photoUrl = await processImageForStorage(file);
        await addImage(homeId, roomId, { url: photoUrl, name: file.name, size: file.size });
        count++;
      }
      toast.success(`Successfully uploaded ${count} photo${count > 1 ? "s" : ""}!`, { id: toastId });
    } catch (err) {
      toast.error("Failed to upload photo. Please try again.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetCover = async (photoUrl: string) => {
    if (!homeId || !roomId) return;
    try {
      await updateRoom(homeId, roomId, { coverImage: photoUrl });
      toast.success("Set as cover photo");
    } catch {
      toast.error("Could not update cover photo");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!homeId || !roomId) return;
    try {
      await deleteImage(homeId, roomId, photoId);
      setSelectedPhoto(null);
      toast.success("Photo removed from gallery");
    } catch {
      toast.error("Could not remove photo");
    }
  };

  return (
    <div id="gallery" className="scroll-mt-24 space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <span className="field-tag text-muted-foreground block mb-1">Gallery</span>
          <h3 className="text-xl font-medium tracking-tight">Zone Photos</h3>
        </div>
        {homeId && roomId && (
          <Button variant="brand" size="sm" onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" /> Upload Photos
              </>
            )}
          </Button>
        )}
      </div>

      {canCompare && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">Drag to compare the earliest and most recent assessment.</p>
          <BeforeAfterSlider before={scanPhotos[0]} after={scanPhotos[scanPhotos.length - 1]} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {/* Add photo tile */}
        {homeId && roomId && (
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="group aspect-square overflow-hidden relative border-2 border-dashed border-border hover:border-brand/60 bg-muted/40 hover:bg-brand/5 flex flex-col items-center justify-center transition-all p-4 text-center cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-brand animate-spin mb-2" />
            ) : (
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-brand transition-colors mb-2" />
            )}
            <span className="text-xs font-medium text-foreground group-hover:text-brand transition-colors">
              Add Photo
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG</span>
          </button>
        )}

        {allPhotos.map((photo, i) => (
          <motion.div
            key={`${photo.id}-${i}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
            className="group aspect-square overflow-hidden relative bg-muted text-left cursor-pointer border border-border"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between" />

            {photo.url === coverImage && (
              <span className="absolute top-2 left-2 tabular text-[9px] font-semibold text-white bg-brand px-1.5 py-0.5 rounded shadow">
                Cover
              </span>
            )}

            <span className="absolute bottom-2 left-2 tabular text-[9px] text-white bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {format(new Date(photo.date), "MMM d, yyyy")}
            </span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 md:p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Header controls */}
            <div className="w-full flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm font-medium opacity-80">
                {format(new Date(selectedPhoto.date), "MMMM d, yyyy")}
              </span>
              <button
                className="text-white hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            <div className="flex-1 flex items-center justify-center my-4 overflow-hidden w-full max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
              <motion.img
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                src={selectedPhoto.url}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
              {homeId && roomId && selectedPhoto.url !== coverImage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/60 border-white/20 text-white hover:bg-white hover:text-black"
                  onClick={() => handleSetCover(selectedPhoto.url)}
                >
                  <Check className="w-4 h-4 mr-2" /> Set as Cover Image
                </Button>
              )}

              {homeId && roomId && !selectedPhoto.isScan && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Photo
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

