import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, Mail, FileJson } from 'lucide-react';
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
    <Card className="border-border/60 shadow-sm bg-muted/10">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Export & Share</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleEmailCaregiver}>
            <Mail className="mr-2 h-4 w-4" /> Email Caregiver
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleCopyLink}>
            <Share2 className="mr-2 h-4 w-4" /> Copy Link
          </Button>
          <Button variant="ghost" size="icon" title="Export JSON" className="md:ml-auto" onClick={handleDownloadJson}>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
