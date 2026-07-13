import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Settings, 
  UploadCloud, 
  Image as ImageIcon,
  MoreVertical,
  X,
  Trash2,
  Maximize2,
  Sparkles,
  ChevronRight,
  Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoomDetailPage() {
  const { homeId, roomId } = useParams();
  const navigate = useNavigate();
  const { homes, addImage, deleteImage, deleteRoom, updateRoom, loading: homeLoading } = useHomeStore();
  const { getScansForRoom, loading: scanLoading } = useScanStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeleteRoomConfirm, setShowDeleteRoomConfirm] = useState(false);
  const [imageToDeleteId, setImageToDeleteId] = useState<string | null>(null);

  const home = homes.find(h => h.id === homeId);
  const room = home?.rooms.find(r => r.id === roomId);
  const scans = getScansForRoom(roomId || "");

  if (homeLoading || scanLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-sm text-muted-foreground mt-4 font-medium">Loading room data...</p>
      </div>
    );
  }

  if (!home || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Room not found</h2>
        <Button onClick={() => navigate(home ? `/homes/${home.id}` : "/homes")}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleDeleteRoom = () => {
    setShowDeleteRoomConfirm(true);
  };

  const handleConfirmDeleteRoom = async () => {
    try {
      await deleteRoom(home.id, room.id);
      setShowDeleteRoomConfirm(false);
      toast.success("Room deleted successfully");
      navigate(`/homes/${home.id}`);
    } catch (err) {
      toast.error("Failed to delete room");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        addImage(home.id, room.id, {
          url,
          name: file.name,
          size: file.size
        });
      });
      setIsUploading(false);
      setUploadProgress(0);
      toast.success(`${files.length} image(s) uploaded successfully`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1200);
  };

  const handleDeleteImage = (imageId: string) => {
    setImageToDeleteId(imageId);
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDeleteId) return;
    try {
      await deleteImage(home.id, room.id, imageToDeleteId);
      if (selectedImage === imageToDeleteId) {
        setSelectedImage(null);
      }
      setImageToDeleteId(null);
      toast.success("Image removed successfully");
    } catch (err) {
      toast.error("Failed to remove image");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/homes/${home.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
            <Badge variant="outline" className="capitalize">{room.type}</Badge>
            <Badge variant="secondary">Floor {room.floor}</Badge>
          </div>
          <p className="text-muted-foreground">{home.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/homes/${home.id}/rooms/${room.id}/scan`)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Scan
          </Button>
          <Button variant="outline" className="hidden sm:flex" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
              <Settings className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>Upload Photos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/homes/${home.id}/rooms/${room.id}/scan`)}>Run AI Scan</DropdownMenuItem>
              <DropdownMenuItem>Edit Room Details</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteRoom}>Delete Room</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <input 
        type="file" 
        multiple 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {isUploading && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-primary flex items-center">
              <UploadCloud className="h-4 w-4 mr-2 animate-bounce" />
              Uploading photos...
            </h3>
            <span className="text-sm font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {scans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">AI Safety Reports</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((scan) => (
              <Card key={scan.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate(`/homes/${home.id}/rooms/${room.id}/reports/${scan.id}`)}>
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Scan Report</h3>
                      <Badge variant="secondary">{scan.safetyScore} / 100</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(scan.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm mt-3">{scan.hazards.length} hazards detected</p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary">
                    View full report <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area & Gallery */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Gallery</h2>
          <span className="text-sm text-muted-foreground">{room.images.length} {room.images.length === 1 ? 'photo' : 'photos'}</span>
        </div>

        {room.images.length === 0 && !isUploading ? (
          <div 
            className="border-dashed border-2 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer min-h-[400px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Upload room photos</h3>
            <p className="max-w-md mx-auto mb-8">
              Take clear, well-lit photos of the entire room, including floors, doorways, and any potential hazards for AI analysis.
            </p>
            <Button>
              <UploadCloud className="mr-2 h-4 w-4" />
              Select Files
            </Button>
            <p className="text-xs mt-4">Supports JPG, PNG, WEBP</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div 
              className="border-dashed border-2 rounded-xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer aspect-square"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium">Add Photos</span>
            </div>
            
            {room.images.map(image => (
              <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-square border bg-muted">
                <img src={image.url} alt={image.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80 hover:bg-background" onClick={(e) => { e.stopPropagation(); setSelectedImage(image.url); }}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80 hover:bg-background" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => {
                          updateRoom(home.id, room.id, { coverImage: image.url });
                          toast.success("Cover image updated");
                        }}>Set as Cover</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteImage(image.id)}>Delete Image</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-white text-xs font-medium truncate">
                    Uploaded {formatDistanceToNow(new Date(image.uploadedAt))} ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Image Preview */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </Button>
          <img src={selectedImage} alt="Fullscreen preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-md" />
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {showDeleteRoomConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Delete Room?</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Are you sure you want to delete this room? This will permanently remove the room, its mapped images, and all related scan reports from this home profile. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteRoomConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDeleteRoom}>
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Image Confirmation Modal */}
      {imageToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Remove Image?</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Are you sure you want to remove this photo? It will be deleted permanently from this room.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setImageToDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDeleteImage}>
                Remove Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
