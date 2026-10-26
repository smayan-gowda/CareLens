import { Button } from '@/components/ui/button';
import { ZoomIn, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import type { BoundingBox, Hazard, DetectedObject, ScanPhoto, SpatialFinding } from '@/types/ai';
import { useState, useMemo } from 'react';
import { normalizeBoundingBox } from '@/utils/spatialGeometry';

interface InteractiveImageProps {
  image?: string;
  photoId?: string;
  photos?: Array<ScanPhoto & { image: string }>;
  onSelectPhoto?: (id: string) => void;
  hazards: Hazard[];
  detectedObjects?: DetectedObject[];
  spatialFindings?: SpatialFinding[];
  selectedHazardId: string | null;
  onSelectHazard: (id: string | null) => void;
  selectedObservationIds?: string[];
  selectedSpatialFindingId?: string | null;
  onSelectSpatialFinding?: (id: string | null) => void;
}

function resolveHazardBox(
  hazard: Hazard,
  detectedObjects: DetectedObject[] = []
): BoundingBox | null {
  if (hazard.objectsInvolved && hazard.objectsInvolved.length > 0 && detectedObjects.length > 0) {
    for (const objName of hazard.objectsInvolved) {
      const matched = detectedObjects.find(
        (o) =>
          o.boundingBox &&
          o.name.toLowerCase().includes(objName.toLowerCase())
      );
      if (matched) return normalizeBoundingBox(matched.boundingBox);
    }
    for (const objName of hazard.objectsInvolved) {
      const matched = detectedObjects.find(
        (o) => o.boundingBox && objName.toLowerCase().includes(o.name.toLowerCase())
      );
      if (matched) return normalizeBoundingBox(matched.boundingBox);
    }
  }

  if (hazard.boundingBox) {
    return normalizeBoundingBox(hazard.boundingBox);
  }

  if (detectedObjects.length > 0) {
    const textToSearch = `${hazard.title} ${hazard.description}`.toLowerCase();
    const matched = detectedObjects.find(
      (o) => o.boundingBox && textToSearch.includes(o.name.toLowerCase())
    );
    if (matched) return normalizeBoundingBox(matched.boundingBox);
  }

  return null;
}

interface OverlayBox {
  id: string;
  box: BoundingBox;
  type: 'both' | 'object' | 'hazard';
  objectName?: string;
  objectId?: string;
  spatialFindingIds?: string[];
  hazardId?: string;
  hazardTitle?: string;
}

function boxesMatch(first: BoundingBox, second: BoundingBox): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

export function InteractiveImage({
  image,
  photoId,
  photos = [],
  onSelectPhoto,
  hazards,
  detectedObjects = [],
  spatialFindings = [],
  selectedHazardId,
  onSelectHazard,
  selectedObservationIds = [],
  selectedSpatialFindingId = null,
  onSelectSpatialFinding,
}: InteractiveImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const currentPhotoIndex = Math.max(0, photos.findIndex((photo) => photo.id === photoId));
  const isOverview = currentPhotoIndex === 0;
  const visibleHazards = hazards.filter(
    (hazard) => hazard.imageId === photoId || (!hazard.imageId && isOverview)
  );
  const visibleObjects = detectedObjects.filter(
    (object) => object.imageId === photoId || (!object.imageId && isOverview)
  );
  const visibleSpatialFindings = spatialFindings.filter(
    (finding) => finding.imageId === photoId || (!finding.imageId && isOverview)
  );

  const unifiedBoxes = useMemo(() => {
    const hBoxes = visibleHazards.map((hazard) => {
      return { hazard, box: resolveHazardBox(hazard, visibleObjects) };
    }).filter((item): item is { hazard: Hazard; box: BoundingBox } => item.box !== null);

    const boxes: OverlayBox[] = [];
    const representedHazards = new Set<string>();

    visibleObjects.forEach((obj, i) => {
      const box = normalizeBoundingBox(obj.boundingBox);
      if (!box) return;
      const relatedHazards = hBoxes.filter((hazardBox) => boxesMatch(hazardBox.box, box));
      const relatedSpatialFindings = visibleSpatialFindings.filter((finding) =>
        finding.objectIds.includes(obj.id)
      );

      if (relatedHazards.length > 0) {
        relatedHazards.forEach(({ hazard }) => representedHazards.add(hazard.id));
        boxes.push({
          id: `obj-haz-${i}`,
          box,
          type: 'both',
          objectName: obj.name,
          objectId: obj.id,
          spatialFindingIds: relatedSpatialFindings.map((finding) => finding.id),
          hazardId: relatedHazards[0].hazard.id,
          hazardTitle: relatedHazards[0].hazard.title,
        });
      } else {
        boxes.push({
          id: `obj-${i}`,
          box,
          type: 'object',
          objectName: obj.name,
          objectId: obj.id,
          spatialFindingIds: relatedSpatialFindings.map((finding) => finding.id),
        });
      }
    });

    hBoxes.forEach((hb) => {
      if (!representedHazards.has(hb.hazard.id)) {
        boxes.push({
          id: hb.hazard.id,
          box: hb.box,
          type: 'hazard',
          hazardId: hb.hazard.id,
          hazardTitle: hb.hazard.title,
        });
      }
    });

    return boxes;
  }, [visibleHazards, visibleObjects, visibleSpatialFindings]);

  return (
    <div className="border border-border bg-card overflow-hidden isolate relative z-0">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div>
          <span className="field-tag text-muted-foreground block">Photo evidence</span>
          <span className="text-xs text-muted-foreground">
            {photos[currentPhotoIndex]?.label || "Room overview"}
          </span>
        </div>
        <button onClick={() => setIsZoomed(!isZoomed)} className="text-muted-foreground hover:text-foreground p-1">
          <span className="sr-only">{isZoomed ? 'Reset image zoom' : 'Zoom image'}</span>
          <ZoomIn className={`h-4 w-4 ${isZoomed ? "text-brand" : ""}`} />
        </button>
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-border bg-muted/20">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-pressed={photo.id === photoId}
              onClick={() => onSelectPhoto?.(photo.id)}
              className={`overflow-hidden rounded-md border text-left transition-colors ${
                photo.id === photoId
                  ? "border-brand ring-2 ring-brand/25"
                  : "border-border hover:border-brand/50"
              }`}
            >
              <img src={photo.image} alt="" className="h-16 w-full object-cover" />
              <span className="block truncate px-2 py-1.5 text-[10px] font-medium">
                {index === 0 ? "Overview" : photo.label}
              </span>
            </button>
          ))}
        </div>
      )}
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
                const isHazardView = item.type === 'hazard' || item.type === 'both';
                const isHazardSelected = item.hazardId && selectedHazardId === item.hazardId;
                const isSpatialSelected =
                  item.spatialFindingIds?.includes(selectedSpatialFindingId || '') ?? false;
                const isObservationSelected = item.objectId
                  ? selectedObservationIds.includes(item.objectId)
                  : false;
                const isSelected = isHazardSelected || isSpatialSelected || isObservationSelected;
                const baseZIndex = isSelected ? 'z-20' : (isHazardView ? 'z-10' : 'z-0');
                const isNearTop = b.y < 8;
                const tagPosClass = isNearTop ? 'top-1 left-1' : '-top-6 left-0';
                const relatedFinding = spatialFindings.find((finding) =>
                  item.spatialFindingIds?.includes(finding.id)
                );

                if (isHazardView) {
                  return (
                    <button
                      type="button"
                      key={item.id}
                      aria-label={
                        item.type === 'both'
                          ? `Select ${relatedFinding ? `${item.objectName}, related to ${relatedFinding.objectsInvolved.join(' and ')}` : item.objectName}`
                          : `Select concern: ${item.hazardTitle}`
                      }
                      title={item.type === 'both' ? `${item.objectName}${relatedFinding ? ` · ${relatedFinding.objectsInvolved.join(' and ')}` : ''}` : item.hazardTitle}
                      className={`absolute border-2 transition-colors cursor-pointer shadow-sm p-0 text-left ${baseZIndex} hover:z-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                        isSelected
                          ? isObservationSelected && !isHazardSelected && !isSpatialSelected
                            ? 'border-amber-400 bg-amber-400/25 shadow-lg'
                            : 'border-destructive bg-destructive/25 shadow-lg'
                          : 'border-destructive/80 bg-destructive/5'
                      }`}
                      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                      onClick={() => {
                        if (item.type === 'both' && relatedFinding && onSelectSpatialFinding) {
                          onSelectHazard(null);
                          onSelectSpatialFinding(
                            selectedSpatialFindingId === relatedFinding.id ? null : relatedFinding.id
                          );
                        } else {
                          onSelectSpatialFinding?.(null);
                          onSelectHazard(isHazardSelected ? null : item.hazardId);
                        }
                      }}
                    >
                      <span
                        className={`absolute ${tagPosClass} tabular text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap shadow-md transition-colors z-30 bg-destructive text-destructive-foreground`}
                      >
                        {isObservationSelected && item.objectName
                          ? item.objectName
                          : isSpatialSelected && item.objectName
                            ? item.objectName
                            : item.hazardTitle}
                      </span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      key={item.id}
                      aria-label={
                        relatedFinding
                          ? `Select spatial finding involving ${item.objectName}`
                          : `Detected object: ${item.objectName}`
                      }
                      title={
                        relatedFinding
                          ? `${item.objectName} · ${relatedFinding.objectsInvolved.join(' and ')}`
                          : item.objectName
                      }
                      className={`absolute border-2 transition-colors p-0 text-left ${baseZIndex} ${
                        isObservationSelected
                          ? 'border-amber-400 bg-amber-400/25 shadow-lg cursor-pointer'
                          : isSpatialSelected
                          ? 'border-brand bg-brand/25 shadow-lg cursor-pointer'
                          : 'border-sky-400/80 bg-sky-400/5'
                      } ${relatedFinding ? 'cursor-pointer hover:z-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white' : 'cursor-default'}`}
                      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                      onClick={() => {
                        if (!relatedFinding || !onSelectSpatialFinding) return;
                        onSelectHazard(null);
                        onSelectSpatialFinding(
                          selectedSpatialFindingId === relatedFinding.id ? null : relatedFinding.id
                        );
                      }}
                    >
                      <span className={`absolute ${tagPosClass} tabular text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap shadow-md bg-sky-500 text-white z-30`}>
                        {item.objectName}
                      </span>
                    </button>
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
        <span className="tabular">{visibleObjects.length} objects in this view</span>
        <span className="tabular">{visibleHazards.length} findings in this view</span>
      </div>
    </div>
  );
}
