import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScanResult } from '@/types/ai';
import { Calendar, ChevronRight, CheckCircle2, Search, Clock, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReportHeaderProps {
  scan: ScanResult;
  homeName?: string;
  roomName?: string;
  homeId: string;
  roomId: string;
}

export function ReportHeader({ scan, homeName, roomName, homeId, roomId }: ReportHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to={`/homes/${homeId}`} className="hover:text-foreground transition-colors">{homeName}</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/homes/${homeId}/rooms/${roomId}`} className="hover:text-foreground transition-colors">{roomName}</Link>
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
        
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to={`/homes/${homeId}/rooms/${roomId}`}>Return to Room</Link>
          </Button>
        </div>
      </div>

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
