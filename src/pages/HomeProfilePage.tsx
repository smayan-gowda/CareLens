import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Settings, 
  Image as ImageIcon, 
  CheckCircle2, 
  CalendarDays,
  LayoutDashboard,
  MoreVertical,
  Activity,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export function HomeProfilePage() {
  const { homeId } = useParams();
  const navigate = useNavigate();
  const { homes, activities, deleteHome, hiddenRooms } = useHomeStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const home = homes.find(h => h.id === homeId);
  const homeActivities = activities.filter(a => a.homeId === homeId);
  
  if (!home) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Home not found</h2>
        <p className="text-muted-foreground mb-6">The home profile you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate("/homes")}>Return to Homes</Button>
      </div>
    );
  }

  const visibleRooms = home.rooms.filter(room => !hiddenRooms.includes(room.id));
  const totalImages = visibleRooms.reduce((acc, room) => acc + room.images.length, 0);
  const progress = visibleRooms.length > 0 ? Math.min(100, visibleRooms.length * 20) : 0;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteHome(home.id);
      setShowDeleteConfirm(false);
      toast.success("Home deleted successfully");
      navigate("/homes");
    } catch (err) {
      toast.error("Failed to delete home");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      {/* Header section with cover image */}
      <div className="relative rounded-2xl overflow-hidden bg-muted border">
        {home.coverImage ? (
          <div className="h-48 md:h-64 w-full">
            <img src={home.coverImage} alt={home.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-primary/5 flex items-center justify-center">
            <LayoutDashboard className="h-16 w-16 text-primary/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}
        
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="icon" className="rounded-full bg-background/50 backdrop-blur hover:bg-background/80" onClick={() => navigate("/homes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full bg-background/50 backdrop-blur hover:bg-background/80" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full bg-background/50 backdrop-blur hover:bg-background/80">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings')}>Edit Home Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Change Cover Image</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>Delete Home</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary backdrop-blur-md border-transparent">
                {home.homeType.charAt(0).toUpperCase() + home.homeType.slice(1)}
              </Badge>
              {home.yearBuilt && (
                <Badge variant="outline" className="bg-background/50 backdrop-blur-md">
                  Built {home.yearBuilt}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{home.name}</h1>
            {home.address && (
              <p className="text-muted-foreground mt-2 flex items-center text-sm md:text-base">
                <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
                {home.address}
              </p>
            )}
          </div>
          
          <Button asChild className="shrink-0 shadow-lg">
            <Link to={`/homes/${home.id}/rooms/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="md:col-span-2 space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Rooms</h2>
            <Badge variant="outline">{visibleRooms.length} Total</Badge>
          </div>

          {visibleRooms.length === 0 ? (
            <div className="border-dashed border-2 rounded-xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10">
              <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
                <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Start mapping your home</h3>
              <p className="max-w-[280px] mx-auto text-sm mb-6">
                Add your first room to begin building your digital twin for AI analysis.
              </p>
              <Button asChild>
                <Link to={`/homes/${home.id}/rooms/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {visibleRooms.map(room => (
                <Link key={room.id} to={`/homes/${home.id}/rooms/${room.id}`}>
                  <Card className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group h-full flex flex-col">
                    <div className="h-32 w-full bg-muted relative overflow-hidden">
                      {room.coverImage || room.images[0]?.url ? (
                        <img 
                          src={room.coverImage || room.images[0].url} 
                          alt={room.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                          Floor {room.floor}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <Badge variant="outline" className="text-xs capitalize">{room.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {room.description || "No description provided."}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-auto pt-4 border-t">
                        <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                        {room.images.length} {room.images.length === 1 ? 'photo' : 'photos'}
                        <span className="mx-2">•</span>
                        Updated {formatDistanceToNow(new Date(room.updatedAt))} ago
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-muted-foreground">Setup Completion</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <ImageIcon className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{totalImages}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Images</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{visibleRooms.length}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rooms</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success mr-2 shrink-0" />
                  <span>Profile created</span>
                </div>
                <div className="flex items-center text-sm">
                  {visibleRooms.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-success mr-2 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted mr-2 shrink-0" />
                  )}
                  <span className={visibleRooms.length === 0 ? "text-muted-foreground" : ""}>Rooms mapped</span>
                </div>
                <div className="flex items-center text-sm">
                  {totalImages > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-success mr-2 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted mr-2 shrink-0" />
                  )}
                  <span className={totalImages === 0 ? "text-muted-foreground" : ""}>Images uploaded</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-muted mr-2 shrink-0" />
                  <span className="text-muted-foreground">AI scan complete</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {homeActivities.length > 0 ? (
                  homeActivities.slice(0, 4).map((activity, i) => (
                    <div key={activity.id} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary/60 mt-1.5 z-10" />
                        {i !== Math.min(homeActivities.length, 4) - 1 && (
                          <div className="w-[1px] h-full bg-border absolute top-3 left-[3.5px]" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-medium leading-none mb-1">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No recent activity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Delete Home?</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Are you sure you want to delete this home profile? This will permanently delete the home and all of its mapped rooms and reports from the database. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
