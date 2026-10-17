import { Accessibility, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccessibilitySummaryProps {
  score?: number;
}

export function AccessibilitySummary({ score = 75 }: AccessibilitySummaryProps) {
  const isGood = score >= 70;

  const checks = [
    { label: 'Wheelchair Clearance', status: 'Marginal', ok: false },
    { label: 'Trip Hazards', status: 'Present', ok: false },
    { label: 'Lighting Accessibility', status: 'Adequate', ok: true },
  ];

  return (
    <div className="border border-border bg-card">
      <div className="flex justify-between items-center px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Accessibility className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
          <span className="font-semibold tracking-tight text-sm">Accessibility Profile</span>
        </div>
        <span className={`field-tag ${isGood ? 'text-brand' : 'text-warning'}`}>Grade {isGood ? 'B+' : 'C'}</span>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-foreground/85 leading-relaxed mb-5">
            The environment presents moderate challenges for continuous wheelchair use, primarily due to furniture density and transition thresholds. Ambulatory assistance devices are generally well-supported.
          </p>

          <div>
            {checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-sm py-2.5 border-b border-border last:border-b-0">
                <span className="text-muted-foreground">{c.label}</span>
                <span className={`font-medium flex items-center gap-1.5 ${c.ok ? 'text-success' : 'text-warning'}`}>
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l border-dashed border-border pl-8">
          <span className="field-tag text-muted-foreground block mb-2">Caregiver notes</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If the primary resident relies on a walker, the immediate priority is securing the loose rug near the entrance. The layout doesn't require major structural changes for ambulatory mobility, but clearing secondary pathways will reduce friction significantly.
          </p>
        </div>
      </div>
    </div>
  );
}
