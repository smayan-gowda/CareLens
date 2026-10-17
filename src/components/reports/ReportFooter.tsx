export function ReportFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-dashed border-border text-center">
      <div className="tabular flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground/60">
        <span>REPORT VER. CL-24.8.1</span>
        <span>MODEL: GEMINI 1.5 PRO VISION</span>
        <span>GENERATED {new Date().toLocaleString()}</span>
        <a href="#" className="hover:text-foreground transition-colors">PRIVACY POLICY</a>
      </div>
    </footer>
  );
}
