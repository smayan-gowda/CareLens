import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHomeStore } from "@/stores/useHomeStore";
import { useScanStore } from "@/stores/scanStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, Trash2, Camera, Upload, ArrowUpRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "motion/react";
import { processImageForStorage } from "@/services/storageService";

import { RoomNav } from "@/components/room/RoomNav";
import { RoomHero } from "@/components/room/RoomHero";
import { RoomHealth } from "@/components/room/RoomHealth";
import { RoomGallery } from "@/components/room/RoomGallery";
import { RoomTimelineSection } from "@/components/room/RoomTimelineSection";
import { buildRoomInsight, scoreColor } from "@/components/room/roomMath";
import { InteractiveImage } from "@/components/reports/InteractiveImage";
import { RecommendationBlocks } from "@/components/reports/RecommendationBlocks";

export function RoomDetailPage() {
  const { homeId, roomId } = useParams();
  const navigate = useNavigate();
  const { homes, deleteRoom, updateRoom, timelineEvents } = useHomeStore();
  const { getScansForRoom } = useScanStore();

  const [showDeleteRoomConfirm, setShowDeleteRoomConfirm] = useState(false);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const home = homes.find(h => h.id === homeId);
  const room = home?.rooms.find(r => r.id === roomId);

  const roomScans = useMemo(
    () => getScansForRoom(roomId || '').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [getScansForRoom, roomId]
  );
  const completedScans = useMemo(() => roomScans.filter(s => s.status === 'Completed'), [roomScans]);
  const latestScan = completedScans[0];
  const previousScan = completedScans[1];

  if (!home || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-2">Zone not found</h2>
        <p className="text-muted-foreground mb-6">This zone doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(`/properties/${homeId}`)}>Return to Property</Button>
      </div>
    );
  }

  const handleDeleteRoom = () => {
    deleteRoom(home.id, room.id);
    toast.success("Zone removed");
    navigate(`/properties/${home.id}`);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photoUrl = await processImageForStorage(file, room.coverImage);
      await updateRoom(home.id, room.id, { coverImage: photoUrl });
      toast.success("Zone cover image updated");
    } catch {
      toast.error("Failed to update cover image");
    }
  };

  const heroImage = latestScan?.images?.[0] || (latestScan as any)?.originalImage || room.coverImage;

  const insight = latestScan
    ? buildRoomInsight({ roomType: room.type, latest: latestScan, previous: previousScan })
    : undefined;

  return (
    <div>
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

      <RoomNav />

      <RoomHero room={room} heroImage={heroImage} latestScan={latestScan} />

      <div className="max-w-5xl mx-auto px-5 md:px-10 space-y-16 md:space-y-24 py-16 md:py-20">
        {/* Back & Actions */}
        <div className="flex items-center justify-between -mt-4">
          <Button variant="ghost" onClick={() => navigate(`/properties/${home.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {home.name}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="brand" onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}/scan`)}>
              <Camera className="w-4 h-4 mr-2" /> New Assessment
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => coverInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Change Cover Image
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteRoomConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Zone
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showDeleteRoomConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive/20 p-6 flex items-center justify-between"
          >
            <div>
              <h3 className="text-destructive font-medium">Remove this zone?</h3>
              <p className="text-destructive/80 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteRoomConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteRoom}>Confirm Delete</Button>
            </div>
          </motion.div>
        )}

        <RoomHealth latestScan={latestScan} previousScan={previousScan} />

        {/* Interactive room + insight */}
        <div id="room" className="scroll-mt-24 space-y-8">
          <span className="field-tag text-muted-foreground block">The Room</span>

          {latestScan ? (
            <>
              <InteractiveImage
                image={heroImage}
                hazards={latestScan.hazards}
                detectedObjects={latestScan.detectedObjects}
                selectedHazardId={selectedHazardId}
                onSelectHazard={setSelectedHazardId}
              />
              {insight && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="narrative text-2xl md:text-3xl leading-[1.35] text-balance max-w-2xl"
                >
                  {insight}
                </motion.p>
              )}
            </>
          ) : (
            <div className="border-t border-b border-border py-16 text-center">
              <Camera className="w-6 h-6 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-lg mb-2">No assessments yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Run a technical scan to identify environmental hazards.</p>
              <Button variant="brand" onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}/scan`)}>
                <Camera className="w-4 h-4 mr-2" /> Run First Assessment
              </Button>
            </div>
          )}
        </div>

        {latestScan && (
          <RecommendationBlocks recommendations={latestScan.recommendations} currentScore={latestScan.safetyScore} scanId={latestScan.id} />
        )}

        <RoomTimelineSection roomScans={roomScans} timelineEvents={timelineEvents} />

        <RoomGallery
          homeId={home.id}
          roomId={room.id}
          roomImages={room.images || []}
          roomScans={roomScans}
          coverImage={room.coverImage}
        />

        {/* Scan history */}
        <div id="history" className="scroll-mt-24">
          <span className="field-tag text-muted-foreground block mb-3">Scan History</span>

          {roomScans.length === 0 ? (
            <div className="border-t border-b border-border py-16 text-center text-sm text-muted-foreground">
              No scans recorded for this room yet.
            </div>
          ) : (
            <div className="border-t border-border">
              {roomScans.map((scan, idx) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx, 6) * 0.05 }}
                  onClick={() => navigate(`/properties/${home.id}/rooms/${room.id}/assessments/${scan.id}`)}
                  className="group cursor-pointer flex gap-5 py-5 border-b border-border"
                >
                  <div className="w-28 h-28 bg-muted overflow-hidden shrink-0 relative brackets text-foreground/20">
                    <div className="bracket-tl" /><div className="bracket-br" />
                    {(scan.images?.[0] || (scan as any).originalImage) ? (
                      <img src={scan.images?.[0] || (scan as any).originalImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground/30" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-medium text-base tracking-tight">
                          {scan.status === 'Completed' ? 'Environmental Audit' : 'Processing'}
                        </h3>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{format(new Date(scan.createdAt), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {scan.status === 'Completed' && (
                        <>
                          <span className={`tabular text-sm font-semibold ${scoreColor(scan.safetyScore)}`}>{scan.safetyScore}</span>
                          <span className="tabular text-sm text-muted-foreground">{scan.hazards.length} finding{scan.hazards.length === 1 ? '' : 's'}</span>
                          {scan.hazards.filter(h => h.severity === 'High' || h.severity === 'Critical').length > 0 && (
                            <span className="field-tag text-destructive">Critical</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
