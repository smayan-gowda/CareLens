import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface AiConfidencePanelProps {
  confidence?: number;
  className?: string;
}

export function AiConfidencePanel({ confidence = 88, className }: AiConfidencePanelProps) {
  const metrics = [
    { label: 'Image Quality', value: 92, note: 'Good' },
    { label: 'Room Coverage', value: 65, note: 'Partial' },
  ];

  return (
    <div className={`border border-border bg-card flex flex-col ${className || ''}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />
          <span className="field-tag text-muted-foreground">Model Confidence</span>
        </div>
        <span className="text-xs text-muted-foreground">CareLens Vision v2.4</span>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="space-y-4 py-1 min-h-[160px] flex flex-col justify-center flex-1">
          <div className="flex items-end justify-between mb-2">
            <span className="tabular text-3xl font-semibold tracking-tight text-success leading-none">{confidence}%</span>
          </div>

          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className={`tabular font-medium ${m.value < 80 ? 'text-warning' : 'text-foreground'}`}>{m.note} ({m.value}%)</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full ${m.value < 80 ? 'bg-warning' : 'bg-success'}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border pt-3 mt-1 flex gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" strokeWidth={1.75} />
            <p>The model detected occlusion behind the main furniture. An additional photo would complete the assessment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
