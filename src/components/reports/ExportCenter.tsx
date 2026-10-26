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
 
 const handleDownloadTextReport = () => {
 const content = `Safety Report for ${homeName} - ${roomName}
Date: ${new Date(scan.createdAt).toLocaleDateString()}
Original Scan Safety Index: ${scan.safetyScore}/100 (preliminary visual assessment; not a professional rating)

Hazards:
${scan.hazards.map(h => `- ${h.title}: ${h.description} (Severity: ${h.severity})`).join('\n')}

Recommendations:
${scan.recommendations.map(r => `- ${r.title}: ${r.description} (Priority: ${r.priority})`).join('\n')}

User reviews may dispute findings but do not change the original scan score.
This report is informational only and does not replace an in-home professional assessment.
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
 toast.success('Text report downloaded');
 };

 const handlePrint = () => {
 window.print();
 };

 const handleEmailCaregiver = () => {
 const subject = encodeURIComponent(`Safety Report: ${homeName} - ${roomName}`);
 const body = encodeURIComponent(`Please review the safety report for ${homeName} - ${roomName}.\n\nOriginal Scan Safety Index: ${scan.safetyScore}/100 (preliminary visual assessment; not a professional rating)\n\nYou can view the full report by logging into the CareLens AI application.`);
 window.location.href = `mailto:?subject=${subject}&body=${body}`;
 toast.info('Opened an email draft in your email app. CareLens does not send the email.');
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
    <div className="border border-border bg-card w-full h-full flex flex-col justify-between gap-6 p-6">
      <div>
        <span className="field-tag text-muted-foreground block mb-4">Export & Share</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTextReport} className="w-full">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Text report
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="w-full">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Save as PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleEmailCaregiver} className="w-full">
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Draft email
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadJson} className="w-full">
            <FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON
          </Button>
        </div>
      </div>

      <div className="border-t border-dashed border-border pt-4 flex gap-2.5 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Disclaimer.</strong> This AI-generated report is for informational purposes only and does not replace a professional in-home assessment by a certified occupational therapist or building inspector.
        </p>
      </div>
    </div>
  );
}
