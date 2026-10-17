import { Button } from '@/components/ui/button';
import { ZoomIn, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Hazard, DetectedObject } from '@/types/ai';
import { useState, useEffect, useMemo } from 'react';
import { normalizeBox } from '../scan/scanStages';

interface InteractiveImageProps {
  image?: string;
  hazards: Hazard[];
  detectedObjects?: DetectedObject[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string | null) => void;
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

export function InteractiveImage({ image, hazards, detectedObjects = [], selectedHazardId, onSelectHazard }: InteractiveImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [toggleState, setToggleState] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setToggleState((prev) => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unifiedBoxes = useMemo(() => {
    const hBoxes = hazards.map((h) => {
      const resolved = resolveHazardBox(h, detectedObjects);
      return { hazard: h, rawBox: resolved, normBox: resolved ? normalizeBox(resolved) : null };
    }).filter((h) => h.normBox);

    const boxes: any[] = [];
    const usedRawBoxes = new Set();

    detectedObjects.forEach((obj, i) => {
      if (!obj.boundingBox) return;
      const relatedHazards = hBoxes.filter((hb) => hb.rawBox === obj.boundingBox);

      if (relatedHazards.length > 0) {
        boxes.push({
          id: `obj-haz-${i}`,
          box: normalizeBox(obj.boundingBox),
          type: 'both',
          objectName: obj.name,
          hazardId: relatedHazards[0].hazard.id,
          hazardTitle: relatedHazards[0].hazard.title,
        });
      } else {
        boxes.push({
          id: `obj-${i}`,
          box: normalizeBox(obj.boundingBox),
          type: 'object',
          objectName: obj.name,
        });
      }
      usedRawBoxes.add(obj.boundingBox);
    });

    hBoxes.forEach((hb) => {
      if (!usedRawBoxes.has(hb.rawBox)) {
        boxes.push({
          id: hb.hazard.id,
          box: hb.normBox!,
          type: 'hazard',
          hazardId: hb.hazard.id,
          hazardTitle: hb.hazard.title,
        });
      }
    });

    return boxes;
  }, [hazards, detectedObjects]);

  return (
    <div className="border border-border bg-card overflow-hidden isolate relative z-0">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <span className="field-tag text-muted-foreground">Interactive Scan</span>
        <button onClick={() => setIsZoomed(!isZoomed)} className="text-muted-foreground hover:text-foreground p-1">
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
      <div className="relative bg-neutral-950 isolate overflow-hidden">
        {image ? (
          <div className={`relative overflow-hidden isolate ${isZoomed ? 'cursor-move' : ''}`}>
            <motion.div
              className="relative origin-center isolate"
              animate={isZoomed ? { scale: 1.5 } : { scale: 1 }}
              drag={isZoomed}
              dragConstraints={isZoomed ? { left: -200, right: 200, top: -200, bottom: 200 } : { left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
            >
              <img src={image} alt="Room scan" className="w-full h-auto block opacity-85 pointer-events-none" />

              {unifiedBoxes.map((item) => {
                const b = item.box;
                let isHazardView = item.type === 'hazard';
                if (item.type === 'both') {
                  isHazardView = selectedHazardId === item.hazardId ? true : toggleState;
                }

                const isSelected = item.hazardId && selectedHazardId === item.hazardId;
                const baseZIndex = isSelected ? 'z-20' : (isHazardView ? 'z-10' : 'z-0');
                const isNearTop = b.y < 8;
                const tagPosClass = isNearTop ? 'top-1 left-1' : '-top-6 left-0';

                if (isHazardView) {
                  return (
                    <div
                      key={item.id}
                      className={`absolute border-2 transition-all cursor-pointer shadow-sm ${baseZIndex} hover:z-30 ${
                        isSelected ? 'border-destructive bg-destructive/20 shadow-lg scale-[1.02]' : 'border-destructive animate-pulse bg-transparent'
                      }`}
                      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                      onClick={() => onSelectHazard(isSelected ? null : item.hazardId)}
                    >
                      <span
                        className={`absolute ${tagPosClass} tabular text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap shadow-md transition-colors z-30 ${
                          isSelected ? 'bg-destructive text-destructive-foreground' : 'bg-destructive text-destructive-foreground'
                        }`}
                      >
                        {item.hazardTitle}
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={item.id}
                      className={`absolute border-2 border-sky-400/80 pointer-events-none ${baseZIndex}`}
                      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                    >
                      <span className={`absolute ${tagPosClass} tabular text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap shadow-md bg-sky-500 text-white z-30`}>
                        {item.objectName}
                      </span>
                    </div>
                  );
                }
              })}
            </motion.div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Eye className="h-6 w-6 mx-auto text-white/30 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-white/50">No image available</p>
          </div>
        )}
      </div>
      <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular">{detectedObjects?.length || 0} objects detected</span>
        <span className="tabular">{hazards.length} hazards found</span>
      </div>
    </div>
  );
}

