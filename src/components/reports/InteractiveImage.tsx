import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Hazard, DetectedObject } from '@/types/ai';
import { useState } from 'react';

interface InteractiveImageProps {
  image?: string;
  hazards: Hazard[];
  detectedObjects?: DetectedObject[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string | null) => void;
}

export function InteractiveImage({ image, hazards, detectedObjects, selectedHazardId, onSelectHazard }: InteractiveImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">Interactive Scan</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsZoomed(!isZoomed)}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 relative bg-black">
        {image ? (
          <div className={`relative overflow-hidden ${isZoomed ? 'cursor-move' : ''}`}>
            <motion.div 
              className="relative origin-center"
              animate={isZoomed ? { scale: 1.5 } : { scale: 1 }}
              drag={isZoomed}
              dragConstraints={isZoomed ? { left: -200, right: 200, top: -200, bottom: 200 } : { left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
            >
              <img src={image} alt="Room scan" className="w-full h-auto block opacity-80 pointer-events-none" />
              
              {/* Bounding Boxes for Objects */}
              {detectedObjects?.map((obj, i) => {
                if (!obj.boundingBox) return null;
                let box = { ...obj.boundingBox };
                // If it's 0-1 scale, convert to percentage
                if (box.x <= 1 && box.y <= 1 && box.width <= 1 && box.height <= 1 && box.width > 0) {
                  box = { x: box.x * 100, y: box.y * 100, width: box.width * 100, height: box.height * 100 };
                }
                // If it's 0-1000 scale, convert to percentage
                else if (box.x > 100 || box.y > 100 || box.width > 100 || box.height > 100) {
                  box = { x: box.x / 10, y: box.y / 10, width: box.width / 10, height: box.height / 10 };
                }
                return (
                <div 
                  key={i}
                  className="absolute border border-blue-400/50 bg-blue-400/10 pointer-events-none"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`
                  }}
                >
                  <span className="absolute -top-5 left-0 bg-blue-500/80 text-white text-[10px] px-1 rounded whitespace-nowrap shadow-sm backdrop-blur-sm">
                    {obj.name}
                  </span>
                </div>
              )})}

              {/* Hazard Markers */}
              {hazards.map((hazard, index) => {
                let box = hazard.boundingBox ? { ...hazard.boundingBox } : { x: 20 + index * 10, y: 20 + index * 10, width: 15, height: 15 };
                // Normalize if Gemini returned 0-1 instead of 0-100
                if (box.x <= 1 && box.y <= 1 && box.width <= 1 && box.height <= 1 && box.width > 0) {
                  box = { x: box.x * 100, y: box.y * 100, width: box.width * 100, height: box.height * 100 };
                } else if (box.x > 100 || box.y > 100 || box.width > 100 || box.height > 100) {
                  box = { x: box.x / 10, y: box.y / 10, width: box.width / 10, height: box.height / 10 };
                }
                const isSelected = selectedHazardId === hazard.id;
                return (
                <div
                  key={hazard.id}
                  className={`absolute border-2 transition-all cursor-pointer group rounded-md ${
                    isSelected ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.5)] z-20' : 'border-destructive bg-destructive/20 z-10 hover:bg-destructive/30 hover:border-destructive/80'
                  }`}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`
                  }}
                  onClick={() => onSelectHazard(isSelected ? null : hazard.id)}
                >
                  <div className={`absolute -top-3 -right-3 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold shadow-md transition-transform duration-300 ${isSelected ? 'bg-primary scale-110' : 'bg-destructive scale-100 group-hover:scale-110'}`}>
                    !
                  </div>
                </div>
              )})}
            </motion.div>
          </div>
        ) : (
          <div className="p-12 text-center bg-muted/50">
            <Eye className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No image available</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 bg-muted/20 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>{detectedObjects?.length || 0} Objects Detected</span>
        <span>{hazards.length} Hazards Found</span>
      </CardFooter>
    </Card>
  );
}
