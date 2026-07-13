import { Info } from 'lucide-react';

export function ReportFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-border/40 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 py-2 px-4 rounded-full max-w-2xl mx-auto border border-border/50">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Disclaimer:</strong> This AI-generated report is intended for informational purposes only and does not replace a professional in-home assessment by a certified occupational therapist or building inspector.
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/70">
        <span>Report Version: CL-24.8.1</span>
        <span>Model: Gemini 1.5 Pro Vision (Fine-tuned)</span>
        <span>Generated: {new Date().toLocaleString()}</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
      </div>
    </footer>
  );
}
