import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ChevronRight, Trash2, Copy, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScanStore } from "@/stores/scanStore";
import { useHomeStore } from "@/stores/useHomeStore";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import type { ScanResult } from "@/types/ai";

interface ReportHeroProps {
  scan: ScanResult;
  mainImage?: string;
  homeName?: string;
  roomName?: string;
  homeId: string;
  roomId: string;
  oneLiner: string;
  isSample?: boolean;
}

const scoreColor = (score: number) =>
  score >= 85 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

export function ReportHero({
  scan,
  mainImage,
  homeName,
  roomName,
  homeId,
  roomId,
  oneLiner,
  isSample = false,
}: ReportHeroProps) {
  const navigate = useNavigate();
  const { deleteScan, addScan } = useScanStore();
  const { homes, addHome, addRoom } = useHomeStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 500], [0, 60]);

  const isSampleScan = isSample || scan.id.startsWith("sample-") || (scan as any).userId === "demo-user";

  const handleDelete = async () => {
    try {
      await deleteScan(roomId, scan.id);
      toast.success("Report deleted");
      navigate(`/properties/${homeId}/rooms/${roomId}`);
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const handleCopyToMyHomes = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please sign in to copy this sample assessment to your profile.");
      navigate("/login");
      return;
    }

    setIsCopying(true);
    try {
      let targetHome = homes[0];
      let targetRoomId = "";

      if (!targetHome) {
        // Create default home for user if none exists
        await addHome(user.uid, {
          name: "My Primary Residence",
          address: "Home Profile",
          homeType: "house",
          floors: 1,
        });
        targetHome = useHomeStore.getState().homes[0];
      }

      if (targetHome) {
        const existingRoom = targetHome.rooms?.find(
          (r) => r.type?.toLowerCase() === (scan.roomType || "").toLowerCase()
        );

        if (existingRoom) {
          targetRoomId = existingRoom.id;
        } else {
          // Add room to home
          const newRoomName = `${scan.roomType || "Room"} (Cloned Sample)`;
          await addRoom(targetHome.id, {
            name: newRoomName,
            type: "custom",
            floor: 1,
          });
          const updatedHome = useHomeStore.getState().homes.find((h) => h.id === targetHome.id);
          const addedRoom = updatedHome?.rooms?.slice(-1)[0];
          targetRoomId = addedRoom?.id || `room-${Date.now()}`;
        }

        const newScanId = `scan-${Date.now()}`;
        const clonedScanData = {
          ...scan,
          id: newScanId,
          userId: user.uid,
          homeId: targetHome.id,
          roomId: targetRoomId,
          createdAt: new Date().toISOString(),
        };

        await addScan(user.uid, targetRoomId, clonedScanData);

        toast.success("Sample assessment copied to your homes!");
        navigate(`/properties/${targetHome.id}/rooms/${targetRoomId}/assessments/${newScanId}`);
      }
    } catch (err) {
      console.error("Failed copying sample assessment:", err);
      toast.error("Failed to copy sample assessment");
    } finally {
      setIsCopying(false);
    }
  };

  const completedDate = new Date(scan.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to={`/properties/${homeId}`} className="hover:text-foreground transition-colors">
            {homeName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/properties/${homeId}/rooms/${roomId}`} className="hover:text-foreground transition-colors">
            {roomName}
          </Link>
        </div>

        {isSampleScan ? (
          <Button
            variant="brand"
            size="sm"
            onClick={handleCopyToMyHomes}
            disabled={isCopying}
            className="flex items-center gap-2 font-medium"
          >
            <Copy className="h-4 w-4" /> {isCopying ? "Copying..." : "Copy to My Homes"}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
      </div>

      {/* Photo */}
      {mainImage && (
        <div
          id="report-hero-sentinel"
          className="relative w-full h-[52vh] min-h-[380px] max-h-[560px] overflow-hidden bg-neutral-900 photo-vignette"
        >
          <motion.img style={{ y: imgY }} src={mainImage} className="w-full h-[120%] object-cover" alt="" />
          <div className="absolute bottom-8 md:bottom-10 left-6 md:left-10 right-8 z-10">
            <span className="field-tag text-white/50 mb-3 block">Completed {completedDate}</span>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-2 mb-4">
              <h1 className="narrative text-white text-4xl md:text-6xl text-balance">{roomName || "Assessment"}</h1>
              <span className={`tabular text-3xl md:text-4xl font-semibold ${scoreColor(scan.safetyScore)}`}>
                {scan.safetyScore}
              </span>
            </div>
            <p className="text-white/70 text-base md:text-lg max-w-xl leading-relaxed">{oneLiner}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-card border border-border p-7 shadow-[var(--elevation-floating)] max-w-md w-full space-y-4"
            >
              <h3 className="text-xl font-semibold tracking-tight">Delete safety report?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                This permanently removes the identified hazards, recommendations, and visualizations for this scan.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Permanently
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
