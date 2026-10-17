import { cn } from "@/lib/utils";

/**
 * CareLens mark — a crosshair/target reticle, the way a surveyor or
 * inspector marks a measurement point. Square, not circular; ticks, not
 * curves. This is the one shape that repeats everywhere in the system
 * (nav mark, loading state, section markers) so it needs to read instantly
 * at 16px and hold up at 96px.
 */
export function LensMark({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" className={cn("block", className)} aria-hidden="true">
 <rect x="3.5" y="3.5" width="17" height="17" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
 <line x1="12" y1="3.5" x2="12" y2="7.5" stroke="currentColor" strokeWidth="1.4" />
 <line x1="12" y1="16.5" x2="12" y2="20.5" stroke="currentColor" strokeWidth="1.4" />
 <line x1="3.5" y1="12" x2="7.5" y2="12" stroke="currentColor" strokeWidth="1.4" />
 <line x1="16.5" y1="12" x2="20.5" y2="12" stroke="currentColor" strokeWidth="1.4" />
 <circle cx="12" cy="12" r="2.25" fill="currentColor" />
 </svg>
 );
}

export function LensMarkBadge({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
 const dims = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
 const iconDims = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-4.5 h-4.5";
 return (
 <div className={cn("shrink-0 rounded-md bg-brand text-brand-foreground flex items-center justify-center", dims, className)}>
 <LensMark className={iconDims} />
 </div>
 );
}
