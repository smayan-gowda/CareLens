export function ReportFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-border/40 text-center space-y-4">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/70">
        <span>Report Version: CL-24.8.1</span>
        <span>Model: Gemini 1.5 Pro Vision (Fine-tuned)</span>
        <span>Generated: {new Date().toLocaleString()}</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
      </div>
    </footer>
  );
}
