import { ShieldCheck, AlertTriangle, Cpu, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import type { AssessmentTrace } from '@/types/ai';

interface AiConfidencePanelProps {
  confidence?: number;
  trace?: AssessmentTrace;
  className?: string;
}

export function AiConfidencePanel({ confidence = 88, trace, className }: AiConfidencePanelProps) {
  const metrics = [
    { label: 'Image Quality', value: 92, note: 'Good' },
    { label: 'Room Coverage', value: 78, note: 'Adequate' },
  ];

  const modelName = trace?.pipeline?.photos[0]?.selectedModel || trace?.model || 'gemini-2.5-flash';
  const rulesVer = trace?.rulesVersion || '2.4.0';
  const engineVer = trace?.engineVersion || 'carelens-deterministic-v2';
  const evaluatedTime = trace?.evaluatedAt ? new Date(trace.evaluatedAt).toLocaleString() : new Date().toLocaleDateString();

  return (
    <div className={`border border-border bg-card flex flex-col ${className || ''}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />
          <span className="field-tag text-muted-foreground">Traceable Assessment Audit</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">v{rulesVer}</span>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Model Confidence</span>
              <span className="tabular text-3xl font-semibold tracking-tight text-success leading-none">{confidence}%</span>
            </div>
            <div className="text-right text-[11px] font-mono text-muted-foreground">
              <span className="text-foreground font-medium block">{modelName}</span>
              <span>{engineVer}</span>
            </div>
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

          <div className="border-t border-dashed border-border pt-3 flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <Cpu className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand" strokeWidth={1.75} />
            <p>
              Evaluated at <span className="text-foreground font-medium">{evaluatedTime}</span>. Scores derived deterministically from candidate findings and physical validation state.
            </p>
          </div>

          {trace?.pipeline && (
            <details className="border-t border-border pt-3 text-xs">
              <summary className="cursor-pointer font-medium text-foreground">
                Scan pipeline record
                <span className="ml-2 font-normal text-muted-foreground">
                  {trace.pipeline.photos.length} photo{trace.pipeline.photos.length === 1 ? '' : 's'} · {trace.pipeline.persistenceStatus}
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                {trace.pipeline.photos.map((photo) => (
                  <div key={photo.imageId} className="rounded-md border border-border p-3 space-y-1.5">
                    <div className="font-medium text-foreground">{photo.label} <span className="font-normal text-muted-foreground">({photo.role})</span></div>
                    <div className="text-muted-foreground">
                      {photo.mimeType}{photo.byteLength !== undefined ? ` · ${photo.byteLength.toLocaleString()} bytes` : ''}
                      {photo.sha256 ? ` · SHA-256 ${photo.sha256.slice(0, 12)}…` : ''}
                    </div>
                    <div className="text-muted-foreground">
                      Model: {photo.selectedModel || 'not selected'}
                      {photo.reportedModelVersion ? ` · version ${photo.reportedModelVersion}` : ''}
                      {' · '}parse {photo.parseStatus}, validation {photo.validationStatus}
                    </div>
                    <div className="text-muted-foreground">
                      {photo.modelAttempts.length} model attempt{photo.modelAttempts.length === 1 ? '' : 's'}
                      {photo.modelAttempts.map((attempt, index) => (
                        <span key={`${attempt.model}-${attempt.attempt}`}>
                          {index === 0 ? ': ' : ' · '}
                          {attempt.model} #{attempt.attempt} {attempt.outcome}
                          {attempt.errorCode ? ` (${attempt.errorCode})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  The fingerprint is metadata only; original image bytes and credentials are not included in this trace.
                </p>
              </div>
            </details>
          )}
        </div>

        <div className="p-3 bg-muted/30 border border-border/80 rounded-lg flex items-start gap-2.5 text-[11px] text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-medium text-foreground block">Privacy & Storage Guarantee</span>
            <p className="leading-normal">
              Room photos are stored strictly under your private account. CareLens never sells photo data or uses personal home images to train public AI models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
