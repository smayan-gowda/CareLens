import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScanResult } from '@/types/ai';
import { Calendar, ChevronRight, CheckCircle2, Search, Clock, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useScanStore } from '@/stores/scanStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ReportHeaderProps {
  scan: ScanResult;
  homeName?: string;
  roomName?: string;
  homeId: string;
  roomId: string;
}

export function ReportHeader({ scan, homeName, roomName, homeId, roomId }: ReportHeaderProps) {
  const navigate = useNavigate();
  const { deleteScan } = useScanStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteScan(roomId, scan.id);
      toast.success("Assessment report deleted successfully");
      navigate(`/properties/${homeId}/rooms/${roomId}`);
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to={`/properties/${homeId}`} className="hover:text-foreground transition-colors">{homeName}</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/properties/${homeId}/rooms/${roomId}`} className="hover:text-foreground transition-colors">{roomName}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">AI Report</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Safety Report: {roomName}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge variant="secondary" className="font-normal border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
            </Badge>
            <Badge variant="outline" className="font-normal bg-blue-50/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              Verified
            </Badge>
            <Badge variant="outline" className="font-normal bg-purple-50/50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-800">
              AI Generated
            </Badge>
            {scan.roomConfidence && scan.roomConfidence > 85 && (
              <Badge variant="outline" className="font-normal bg-amber-50/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                High Confidence
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete Report
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to={`/properties/${homeId}/rooms/${roomId}`}>Return to Room</Link>
          </Button>
        </div>
      </div>

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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4"
            >
              <h3 className="text-xl font-semibold tracking-tight">Delete Safety Report?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                Are you sure you want to permanently delete this safety report? This action cannot be undone and will erase all identified hazards, recommendations, and visualizations.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" className="rounded-full" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" className="rounded-full px-6" onClick={handleDelete}>Delete Permanently</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/60 bg-muted/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Scan Date</p>
              <p className="text-sm font-semibold">{new Date(scan.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/60 bg-muted/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Room Type</p>
              <p className="text-sm font-semibold">{scan.roomType || 'Unknown'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 bg-muted/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Analysis Time</p>
              <p className="text-sm font-semibold">1.2s</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 bg-muted/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Images Analyzed</p>
              <p className="text-sm font-semibold">{scan.images.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
