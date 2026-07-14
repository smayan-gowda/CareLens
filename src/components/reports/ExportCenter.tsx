import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, Mail, FileJson, Info } from 'lucide-react';
import { ScanResult } from '@/types/ai';
import { toast } from 'sonner';

interface ExportCenterProps {
  scan: ScanResult;
  homeName?: string;
  roomName?: string;
}

export function ExportCenter({ scan, homeName = 'Home', roomName = 'Room' }: ExportCenterProps) {
  
  const handleDownloadPDF = () => {
    toast.info('Preparing report download...');
    const content = `Safety Report for ${homeName} - ${roomName}
Date: ${new Date(scan.createdAt).toLocaleDateString()}
Safety Score: ${scan.safetyScore}/100

Hazards:
${scan.hazards.map(h => `- ${h.title}: ${h.description} (Severity: ${h.severity})`).join('\n')}

Recommendations:
${scan.recommendations.map(r => `- ${r}`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-report-${roomName}-${new Date(scan.createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailCaregiver = () => {
    const subject = encodeURIComponent(`Safety Report: ${homeName} - ${roomName}`);
    const body = encodeURIComponent(`Please review the safety report for ${homeName} - ${roomName}.\n\nSafety Score: ${scan.safetyScore}/100\n\nYou can view the full report by logging into the CareLens AI application.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Opened email client');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Report link copied to clipboard');
  };

  const handleDownloadJson = () => {
    const content = JSON.stringify(scan, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-report-${roomName}-${new Date(scan.createdAt).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  return (
    <Card className="border-border/60 shadow-sm bg-muted/10 w-full h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Export & Share</h3>
          <div className="flex flex-wrap gap-2.5 items-center">
            <Button variant="outline" size="sm" className="h-9" onClick={handleDownloadPDF}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleEmailCaregiver}>
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Email Caregiver
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleCopyLink}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" /> Copy Link
            </Button>
            <Button variant="ghost" size="icon" title="Export JSON" className="h-9 w-9 md:ml-auto" onClick={handleDownloadJson}>
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="bg-neutral-500/10 border border-neutral-500/20 dark:border-neutral-800/50 rounded-lg p-3.5 text-xs text-muted-foreground flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-neutral-400" />
          <p className="leading-relaxed">
            <strong className="text-foreground">Disclaimer:</strong> This AI-generated report is intended for informational purposes only and does not replace a professional in-home assessment by a certified occupational therapist or building inspector.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
