import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StagedPhoto, RoomType } from "@/types/home";
import { useStagingStore } from "@/stores/useStagingStore";

const ROOM_OPTIONS: { type: RoomType; label: string }[] = [
  { type: "bathroom", label: "Bathroom" },
  { type: "bedroom", label: "Bedroom" },
  { type: "kitchen", label: "Kitchen" },
  { type: "living", label: "Living Room" },
  { type: "hallway", label: "Hallway" },
  { type: "staircase", label: "Staircase" },
  { type: "entryway", label: "Entryway" },
  { type: "dining", label: "Dining Room" },
  { type: "laundry", label: "Laundry" },
  { type: "garage", label: "Garage" },
  { type: "custom", label: "Other" }
];

interface PhotoEditModalProps {
  photo: StagedPhoto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoEditModal({ photo, open, onOpenChange }: PhotoEditModalProps) {
  const { updatePhoto } = useStagingStore();
  const [title, setTitle] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("bathroom");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (photo) {
      setTitle(photo.title || "");
      setRoomType(photo.roomType || "bathroom");
      setNotes(photo.notes || "");
    }
  }, [photo]);

  if (!photo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a photo title");
      return;
    }

    try {
      setSaving(true);
      await updatePhoto(photo.id, {
        title: title.trim(),
        roomType,
        notes: notes.trim()
      });
      toast.success("Photo details updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Edit Staged Photo</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update room categorization, title, and safety notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {photo.imageUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden border border-border bg-black/5">
              <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Room Category</Label>
            <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto p-1 border border-border/80 rounded-lg bg-muted/20">
              {ROOM_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setRoomType(opt.type)}
                  className={`text-left text-[11px] px-2 py-1.5 rounded transition-all truncate font-medium ${
                    roomType === opt.type 
                      ? "bg-brand text-brand-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Photo Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Safety Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none h-18"
              placeholder="Add observations about grab bars, floor slips, or lighting..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs h-9"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 text-xs h-9 bg-brand text-brand-foreground hover:brightness-105"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
