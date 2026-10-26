import { Button } from '@/components/ui/button';
import { ImageIcon, Wand2, Sparkles, HelpCircle } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Recommendation, Hazard, DetectedObject } from '@/types/ai';

interface BeforeAfterPreviewProps {
 originalImage: string;
 recommendations: Recommendation[];
 hazards?: Hazard[];
 detectedObjects?: DetectedObject[];
}

function resolveHazardBox(hazard: any, detectedObjects: any[] = []): any {
  if (hazard.objectsInvolved && hazard.objectsInvolved.length > 0 && detectedObjects.length > 0) {
    for (const objName of hazard.objectsInvolved) {
      const matched = detectedObjects.find(
        (o) => o.boundingBox && o.name.toLowerCase().includes(objName.toLowerCase())
      );
      if (matched) return matched.boundingBox;
    }
    for (const objName of hazard.objectsInvolved) {
      const matched = detectedObjects.find(
        (o) =>
          o.boundingBox &&
          (o.name.toLowerCase().includes(objName.toLowerCase()) ||
            objName.toLowerCase().includes(o.name.toLowerCase()))
      );
      if (matched) return matched.boundingBox;
    }
  }

  if (hazard.boundingBox) {
    return hazard.boundingBox;
  }

  if (detectedObjects.length > 0) {
    const textToSearch = `${hazard.title} ${hazard.description}`.toLowerCase();
    const matched = detectedObjects.find(
      (o) => o.boundingBox && textToSearch.includes(o.name.toLowerCase())
    );
    if (matched) return matched.boundingBox;
  }

  return null;
}

export function BeforeAfterPreview({ originalImage, recommendations, hazards = [], detectedObjects = [] }: BeforeAfterPreviewProps) {
 const [isGenerating, setIsGenerating] = useState(false);
 const [progress, setProgress] = useState(0);
 const [generated, setGenerated] = useState(false);
 const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
 const [sliderPosition, setSliderPosition] = useState(50);
 const [apiError, setApiError] = useState<string | null>(null);
 const [apiErrors, setApiErrors] = useState<string[] | null>(null);
 const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 // Helper function to safely parse and translate bounding box coordinates to 0-100 range
 const parseBox = (box: any) => {
 if (!box) return null;
 let x = box.x;
 let y = box.y;
 let width = box.width;
 let height = box.height;

 // Check if coordinates are normalized (0 to 1) or percentages (0 to 100)
 if (x <= 1 && y <= 1 && width <= 1 && height <= 1 && width > 0) {
 x *= 100;
 y *= 100;
 width *= 100;
 height *= 100;
 } else if (x > 100 || y > 100 || width > 100 || height > 100) {
 // Normalize down if values are huge (e.g. from raw pixels)
 x = x / 10;
 y = y / 10;
 width = width / 10;
 height = height / 10;
 }

 // Return bounded coordinates with padding to stay within the canvas
 return {
 x: Math.max(12, Math.min(x, 88)),
 y: Math.max(12, Math.min(y, 85)),
 width: Math.max(15, Math.min(width, 40)),
 height: Math.max(10, Math.min(height, 35))
 };
 };

 // Compile a list of visual upgrades with coordinates and specific asset types
 const visualUpgrades = useMemo(() => {
 // Standard fallback coordinates to spread pins neatly if hazard bounding boxes are missing
 const fallbacks = [
 { x: 30, y: 55 }, // middle-left (e.g. toilet grab bar)
 { x: 75, y: 65 }, // middle-right (e.g. shower grab bar)
 { x: 50, y: 78 }, // bottom-middle (e.g. bath mat)
 { x: 22, y: 76 }, // bottom-left (e.g. vanity mat)
 { x: 78, y: 35 }, // top-right (e.g. shower light)
 { x: 45, y: 20 }, // top-middle (e.g. ceiling light)
 ];

 let fallbackIdx = 0;

 return recommendations.map((rec) => {
 // Find a related hazard using relatedHazardIds or keywords
 const relatedHazard = hazards.find(h => 
 rec.relatedHazardIds?.includes(h.id) || 
 h.title.toLowerCase().includes(rec.title.toLowerCase()) || 
 rec.title.toLowerCase().includes(h.title.toLowerCase())
 ) || hazards.find(h => h.boundingBox); // fallback to any hazard with coordinate details

 const resolvedBox = relatedHazard ? resolveHazardBox(relatedHazard, detectedObjects) : null;
 let coords = resolvedBox ? parseBox(resolvedBox) : null;

 if (!coords) {
 // Use a distributed fallback position
 const fb = fallbacks[fallbackIdx % fallbacks.length];
 fallbackIdx++;
 coords = { x: fb.x, y: fb.y, width: 25, height: 15 };
 }

 // Determine visual upgrade asset type dynamically from recommendation content
 let type: 'grab_bar' | 'mat' | 'lighting' | 'pathway' | 'stair_strip' | 'general' = 'general';
 const text = (rec.title + " " + rec.description).toLowerCase();
 if (text.includes('bar') || text.includes('grab') || text.includes('rail') || text.includes('handrail')) {
 type = 'grab_bar';
 } else if (text.includes('mat') || text.includes('rug') || text.includes('floor') || text.includes('traction') || text.includes('carpet')) {
 type = 'mat';
 } else if (text.includes('light') || text.includes('led') || text.includes('lamp') || text.includes('illumination') || text.includes('brightness') || text.includes('nightlight') || text.includes('brighten')) {
 type = 'lighting';
 } else if (text.includes('clear') || text.includes('clutter') || text.includes('cord') || text.includes('wire') || text.includes('pathway') || text.includes('obstacle') || text.includes('tidy')) {
 type = 'pathway';
 } else if (text.includes('stair') || text.includes('step') || text.includes('staircase') || text.includes('tread')) {
 type = 'stair_strip';
 }

 return {
 id: rec.id,
 title: rec.title,
 description: rec.description,
 type,
 x: coords.x,
 y: coords.y,
 width: coords.width,
 height: coords.height,
 priority: rec.priority,
 cost: rec.estimatedCost,
 difficulty: rec.difficulty
 };
 });
 }, [recommendations, hazards]);

 const hasLight = visualUpgrades.some(up => up.type === 'lighting');

 const handleGenerate = async () => {
 setIsGenerating(true);
 setProgress(5);
 setApiError(null);
 setApiErrors(null);

 // Progress animation simulation
 let currentProgress = 5;
 const interval = setInterval(() => {
 currentProgress += Math.random() * 8 + 3;
 if (currentProgress > 92) {
 currentProgress = 92;
 }
 setProgress(Math.floor(currentProgress));
 }, 350);

 try {
 let imageToSend = originalImage;
 if (originalImage.startsWith('blob:')) {
 try {
 const res = await fetch(originalImage);
 const blob = await res.blob();
 imageToSend = await new Promise<string>((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(blob);
 });
 } catch (convertErr) {
 console.error("Failed to convert blob URL to Base64 in BeforeAfterPreview:", convertErr);
 }
 }

 const response = await fetch('/api/visualize-upgrades', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 image: imageToSend,
 upgrades: recommendations.map(r => `${r.title}: ${r.description}`),
 }),
 });

 const data = await response.json();
 clearInterval(interval);

 if (response.ok && data.success && data.image) {
 setProgress(100);
 setVisualizedImage(data.image);
 setApiErrors(null);
 setTimeout(() => {
 setIsGenerating(false);
 setGenerated(true);
 }, 400);
 } else {
 if (data.errors && data.errors.length > 0) {
 setApiErrors(data.errors);
 }
 throw new Error(data.error || 'Failed to generate visual upgrades.');
 }
 } catch (err: any) {
 console.warn("AI Visualization API call failed, falling back to stylized interactive visualizer:", err);
 setApiError(err.message || "Quota limit exceeded for free-tier image generation.");
 clearInterval(interval);
 setProgress(100);
 
 // Smoothly transition to the localized interactive fallback overlays
 setTimeout(() => {
 setIsGenerating(false);
 setGenerated(true);
 }, 450);
 }
 };

 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
 if (!containerRef.current) return;
 
 let clientX = 0;
 if ('touches' in e) {
 clientX = e.touches[0].clientX;
 } else {
 if (e.buttons !== 1) return;
 clientX = e.clientX;
 }

 const { left, width } = containerRef.current.getBoundingClientRect();
 let x = clientX - left;
 x = Math.max(0, Math.min(x, width));
 const percentage = (x / width) * 100;
 setSliderPosition(percentage);
 };

 return (
 <div className="border border-border bg-card overflow-hidden">
 <div className="border-b border-border p-4 flex justify-between items-center">
 <span className="field-tag text-muted-foreground flex items-center gap-2">
 <Wand2 className="h-3.5 w-3.5 text-brand" /> Safety Upgrade Visualizer
 </span>
 {!generated && !isGenerating && (
 <Button onClick={handleGenerate} variant="brand" size="sm">
 <Wand2 className="h-3 w-3 mr-2" /> Generate AI Mockup
 </Button>
 )}
 </div>
 <div>
 {isGenerating ? (
 <div className="flex flex-col items-center justify-center p-8 bg-muted/20 aspect-[4/3]">
 <Wand2 className="h-6 w-6 text-brand animate-pulse mb-3" />
 <h3 className="text-base font-medium mb-1 animate-pulse">Rendering Safety Enhancements</h3>
 <p className="text-xs text-muted-foreground mb-4 text-center max-w-[280px]">
 Analyzing room surfaces to visually install handrails, grab bars, and non-slip rubber padding...
 </p>
 <Progress value={progress} className="w-48 h-1.5" />
 </div>
 ) : generated ? (
 <div 
 ref={containerRef}
 className="relative aspect-[4/3] bg-black overflow-hidden cursor-ew-resize select-none"
 onMouseMove={handleMouseMove}
 onTouchMove={handleMouseMove}
 onMouseDown={handleMouseMove}
 onTouchStart={handleMouseMove}
 >
 {/* Base layer (AFTER) */}
 <img 
 src={visualizedImage || originalImage} 
 className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
 alt="After" 
 referrerPolicy="no-referrer"
 onError={() => {
   if (visualizedImage) {
     setVisualizedImage(null);
     setApiError("The generated image could not be displayed; showing the interactive overlay instead.");
   }
 }}
 />
 
 {/* Apply styling or physical overlays if we didn't get an AI generated image */}
 {!visualizedImage && (
 <>
 <div className="absolute inset-0 bg-success/10 mix-blend-overlay pointer-events-none"></div>
 
 {hasLight && (
 <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-warning/25 blur-3xl rounded-full pointer-events-none z-0"></div>
 )}
 
 {/* Dynamically draw physical upgrades based on recommendation matching */}
 {visualUpgrades.map((upgrade, i) => {
 if (upgrade.type === 'grab_bar') {
 return (
 <div 
 key={`bar-${upgrade.id}-${i}`} 
 className="absolute pointer-events-none z-[5] transition-opacity duration-300" 
 style={{ 
 top: `${upgrade.y}%`, 
 left: `${upgrade.x - upgrade.width / 2}%`, 
 width: `${upgrade.width}%`, 
 height: '14px',
 opacity: sliderPosition < upgrade.x ? 1 : 0
 }}
 >
 {/* Realistic metal grab bar with wall mounts */}
 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-500 rounded-full shadow-2xl border border-slate-300"></div>
 <div className="absolute top-[-2px] left-[5%] w-4.5 h-4.5 bg-slate-400 rounded-full shadow-lg border border-slate-300"></div>
 <div className="absolute top-[-2px] right-[5%] w-4.5 h-4.5 bg-slate-400 rounded-full shadow-lg border border-slate-300"></div>
 </div>
 );
 }
 
 if (upgrade.type === 'mat') {
 return (
 <div 
 key={`mat-${upgrade.id}-${i}`} 
 className="absolute pointer-events-none z-[5] overflow-hidden rounded-lg shadow-xl border border-teal-500 bg-teal-700/80 transform -skew-x-[15deg] transition-opacity duration-300" 
 style={{ 
 top: `${upgrade.y}%`, 
 left: `${upgrade.x - upgrade.width / 2}%`, 
 width: `${upgrade.width}%`, 
 height: `${upgrade.height}%`,
 opacity: sliderPosition < upgrade.x ? 1 : 0
 }}
 >
 {/* Textured rubber non-slip pattern */}
 <div className="w-full h-full opacity-40 animate-pulse" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
 </div>
 );
 }

 if (upgrade.type === 'lighting') {
 return (
 <div 
 key={`light-${upgrade.id}-${i}`} 
 className="absolute top-0 left-0 w-full h-full pointer-events-none z-[4] transition-opacity duration-300" 
 style={{ 
 opacity: sliderPosition < upgrade.x ? 1 : 0,
 background: `radial-gradient(circle at ${upgrade.x}% ${upgrade.y}%, rgba(250, 204, 21, 0.25) 0%, rgba(250, 204, 21, 0.05) 55%, transparent 100%)`
 }}
 ></div>
 );
 }

 if (upgrade.type === 'pathway') {
 return (
 <div 
 key={`path-${upgrade.id}-${i}`} 
 className="absolute pointer-events-none z-[4] overflow-hidden rounded-md border-2 border-dashed border-success/80 bg-success/15 shadow-inner transition-opacity duration-300 flex items-center justify-center backdrop-blur-[0.5px]" 
 style={{ 
 top: `${upgrade.y}%`, 
 left: `${upgrade.x - upgrade.width / 2}%`, 
 width: `${upgrade.width}%`, 
 height: `${upgrade.height}%`,
 opacity: sliderPosition < upgrade.x ? 1 : 0
 }}
 >
 <div className="text-[9px] text-success font-bold tracking-widest uppercase bg-success/75 px-1.5 py-0.5 rounded border border-success/40 animate-pulse">CLEARED</div>
 </div>
 );
 }

 if (upgrade.type === 'stair_strip') {
 return (
 <div 
 key={`stair-${upgrade.id}-${i}`} 
 className="absolute pointer-events-none z-[5] transition-opacity duration-300 flex flex-col gap-1" 
 style={{ 
 top: `${upgrade.y}%`, 
 left: `${upgrade.x - upgrade.width / 2}%`, 
 width: `${upgrade.width}%`, 
 opacity: sliderPosition < upgrade.x ? 1 : 0
 }}
 >
 <div className="h-1.5 w-full bg-gradient-to-r from-warning via-warning to-warning rounded-sm border-b border-black/30 shadow-md relative overflow-hidden">
 <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[size:6px_6px]"></div>
 </div>
 <div className="h-1.5 w-full bg-gradient-to-r from-warning via-warning to-warning rounded-sm border-b border-black/30 shadow-md relative overflow-hidden" style={{ transform: 'translateX(4px)' }}>
 <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[size:6px_6px]"></div>
 </div>
 </div>
 );
 }
 
 return null;
 })}
 </>
 )}

 {/* Glowing Interactive Pins on top of the base layer, revealed by slider */}
 {visualUpgrades.map((upgrade, i) => {
 const isRevealed = sliderPosition < upgrade.x;
 
 return (
 <div
 key={`pin-${upgrade.id}-${i}`}
 className={`absolute -translate-x-1/2 -translate-y-1/2 z-[8] transition-all duration-300 group ${
 isRevealed ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'
 }`}
 style={{ 
 top: `${upgrade.y}%`, 
 left: `${upgrade.x}%`,
 }}
 >
 {/* Glowing pulsing point */}
 <div className="relative flex h-8 w-8 items-center justify-center cursor-pointer">
 <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-success opacity-40"></span>
 <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-success border border-white text-white font-bold text-[10px] shadow-lg group-hover:bg-success group-hover:scale-115 transition-transform duration-200">
 ✓
 </span>
 </div>

 {/* Interactive popup tooltip details */}
 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-52 bg-slate-900/95 text-white p-2.5 rounded-lg shadow-2xl border border-slate-700/50 backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
 <div className="flex justify-between items-start gap-1 mb-1">
 <span className="font-semibold text-[11px] leading-tight text-white block">{upgrade.title}</span>
 <span className={`text-[8px] px-1 rounded-sm uppercase tracking-wider font-bold shrink-0 ${
 upgrade.priority === 'Critical' ? 'bg-destructive/30 text-destructive' :
 upgrade.priority === 'High' ? 'bg-warning/30 text-warning' :
 'bg-brand/30 text-brand'
 }`}>{upgrade.priority}</span>
 </div>
 <p className="text-[10px] text-slate-300 leading-snug mb-1.5">{upgrade.description}</p>
 <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-800/80 pt-1 mt-1">
 <span>Cost: <strong className="text-slate-200">{upgrade.cost}</strong></span>
 <span>Difficulty: <strong className="text-slate-200">{upgrade.difficulty}</strong></span>
 </div>
 <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-slate-900/95"></div>
 </div>
 </div>
 );
 })}
 
 <div className="absolute bottom-4 right-4 bg-brand text-brand-foreground px-2 py-1 tabular text-[10px] font-semibold pointer-events-none z-0">AFTER</div>

 {/* Top layer (BEFORE) with clip-path */}
 <div 
 className="absolute inset-0 w-full h-full pointer-events-none z-10"
 style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
 >
 <img src={originalImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Before" referrerPolicy="no-referrer" />
 <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 tabular text-[10px] font-semibold pointer-events-none">BEFORE</div>
 </div>
 
 {/* Handle */}
 <div 
 className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none z-20"
 style={{ left: `${sliderPosition}%` }}
 >
 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black p-2 rounded-full shadow-xl shadow-black/50 flex gap-0.5 border border-slate-200">
 <div className="w-0.5 h-4 bg-slate-400 rounded-full"></div>
 <div className="w-0.5 h-4 bg-slate-400 rounded-full"></div>
 </div>
 </div>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center p-8 bg-muted/20 aspect-[4/3]">
 <ImageIcon className="h-6 w-6 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
 <h3 className="text-base font-medium text-muted-foreground">Ready to Visualize</h3>
 <p className="text-xs text-muted-foreground/70 mt-1 max-w-[250px] text-center">
 Generate a mockup showing how your space will look after implementing the recommended safety improvements.
 </p>
 </div>
 )}
 </div>
 {generated && (
 <>
 {!visualizedImage && (
 <div className="bg-warning/50 border-t border-warning/50 p-4 text-xs">
 <div className="flex gap-2.5">
 <HelpCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
 <div className="space-y-1 flex-1">
 <h4 className="font-semibold text-warning">Interactive Safety Overlay Active (AI Fallback)</h4>
 <p className="text-warning leading-relaxed text-[11px]">
 We have applied our highly accurate, interactive visual overlay to show you exactly where safety grab bars, non-slip rubber mats, cleared pathways, and safety lighting would be installed. Hover or tap the green checkmark pins above to preview each recommendation.
 </p>
 <p className="text-warning leading-relaxed text-[11px] pt-1">
 Agnes AI image generation was unavailable or returned an image that could not be displayed. This local interactive overlay is a visual guide, not a generated edit of the room.
 </p>
 
 {apiErrors && apiErrors.length > 0 && (
 <div className="mt-2 pt-1.5 border-t border-warning/30">
 <button 
 type="button"
 onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
 className="text-[10px] font-semibold text-warning hover:underline flex items-center gap-1 cursor-pointer"
 >
 {showTechnicalDetails ? "Hide Technical Diagnostics" : "View Technical Diagnostics"}
 </button>
 {showTechnicalDetails && (
 <div className="mt-2 p-2 bg-warning/40 rounded border border-warning/35 font-mono text-[9px] text-warning space-y-1.5 max-h-36 overflow-y-auto">
 {apiErrors.map((err, idx) => (
 <div key={idx} className="border-b border-warning/20 last:border-0 pb-1 last:pb-0 leading-normal">
 <strong>Diagnostic Attempt {idx + 1}:</strong> {err}
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 <div className="bg-muted/30 border-t border-border/40 p-3 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center text-xs">
 <span className="text-muted-foreground flex items-center gap-1.5 leading-tight">
 {visualizedImage ? (
 <>
 <Sparkles className="h-3 w-3 text-brand animate-pulse" />
 <span>Visual upgrades generated using Agnes AI. Drag slider to compare.</span>
 </>
 ) : (
 <>
 <HelpCircle className="h-3.5 w-3.5 text-warning shrink-0" />
 <span>
 Interactive safety upgrades overlay applied. Hover checkmarks to preview specific installations.
 </span>
 </>
 )}
 </span>
 <div className="flex items-center gap-2 mt-1 sm:mt-0">
 {apiError && (
 <span className="text-[10px] text-warning bg-warning px-1.5 py-0.5 rounded border border-warning/55 font-medium max-w-[180px] truncate" title={apiError}>
 Using stylized overlays (Free Tier fallback)
 </span>
 )}
 <Button variant="ghost" size="sm" onClick={handleGenerate} className="h-7 text-[10px] text-brand hover:text-brand flex items-center gap-1 px-2 py-1">
 <Wand2 className="h-3 w-3" /> Regenerate
 </Button>
 </div>
 </div>
 </>
 )}
 </div>
 );
}
