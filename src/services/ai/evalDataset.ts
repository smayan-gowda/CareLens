import type { DetectedObject, SpatialEvidenceStatus, SpatialRelationType } from '@/types/ai';

export interface ExpectedSpatialRelation {
  relationType: SpatialRelationType;
  objectIds: string[];
  evidenceStatus: SpatialEvidenceStatus;
}

export interface SpatialEvaluationCase {
  id: string;
  roomType?: string;
  cameraAngle?: string;
  lighting?: string;
  difficulty?: string;
  groundTruthObjects?: DetectedObject[];
  detectedObjects: DetectedObject[];
  expectedRelations: ExpectedSpatialRelation[];
}

const originalCases: SpatialEvaluationCase[] = [
  {
    id: 'overlapping-boxes',
    detectedObjects: [
      { id: 'rug', name: 'Rug', confidence: 92, boundingBox: { x: 20, y: 30, width: 30, height: 25 } },
      { id: 'table', name: 'Coffee table', confidence: 90, boundingBox: { x: 35, y: 40, width: 30, height: 25 } },
    ],
    expectedRelations: [
      { relationType: 'overlap', objectIds: ['rug', 'table'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'near-non-overlapping-objects',
    detectedObjects: [
      { id: 'chair', name: 'Chair', confidence: 90, boundingBox: { x: 10, y: 10, width: 15, height: 15 } },
      { id: 'table', name: 'Table', confidence: 90, boundingBox: { x: 30, y: 10, width: 15, height: 15 } },
    ],
    expectedRelations: [
      { relationType: 'proximity', objectIds: ['chair', 'table'], evidenceStatus: 'Geometrically Supported' },
    ],
  },
  {
    id: 'explicit-walkway-overlap',
    detectedObjects: [
      { id: 'walkway', name: 'Walkway', confidence: 92, boundingBox: { x: 10, y: 60, width: 80, height: 30 } },
      { id: 'cord', name: 'Electrical cord', confidence: 90, boundingBox: { x: 35, y: 70, width: 20, height: 10 } },
    ],
    expectedRelations: [
      { relationType: 'walkway-overlap', objectIds: ['walkway', 'cord'], evidenceStatus: 'Potential Concern' },
    ],
  },
  {
    id: 'walkway-doorway-regions-not-obstructions',
    detectedObjects: [
      { id: 'walkway', name: 'Walkway', confidence: 92, boundingBox: { x: 10, y: 55, width: 80, height: 35 } },
      { id: 'doorway', name: 'Doorway', confidence: 90, boundingBox: { x: 60, y: 20, width: 25, height: 50 } },
    ],
    expectedRelations: [],
  },
  {
    id: 'uncertain-walkway-detection',
    detectedObjects: [
      { id: 'walkway', name: 'Pathway', confidence: 42, boundingBox: { x: 10, y: 60, width: 80, height: 30 } },
      { id: 'basket', name: 'Basket', confidence: 48, boundingBox: { x: 35, y: 70, width: 20, height: 10 } },
    ],
    expectedRelations: [
      { relationType: 'walkway-overlap', objectIds: ['walkway', 'basket'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'missing-bounding-box',
    detectedObjects: [
      { id: 'cord', name: 'Electrical cord', confidence: 90 },
      { id: 'chair', name: 'Chair', confidence: 90, boundingBox: { x: 20, y: 20, width: 20, height: 20 } },
    ],
    expectedRelations: [],
  },
  {
    id: 'invalid-coordinates',
    detectedObjects: [
      { id: 'invalid', name: 'Rug', confidence: 95, boundingBox: { x: 96, y: 15, width: 12, height: 20 } },
      { id: 'chair', name: 'Chair', confidence: 90, boundingBox: { x: 20, y: 20, width: 20, height: 20 } },
    ],
    expectedRelations: [],
  },
  {
    id: 'duplicate-detections',
    detectedObjects: [
      { id: 'chair-1', name: 'Chair', confidence: 90, boundingBox: { x: 20, y: 20, width: 30, height: 30 } },
      { id: 'chair-2', name: 'Chair', confidence: 88, boundingBox: { x: 21, y: 21, width: 30, height: 30 } },
    ],
    expectedRelations: [
      {
        relationType: 'duplicate-detection',
        objectIds: ['chair-1', 'chair-2'],
        evidenceStatus: 'Needs Review',
      },
    ],
  },
  {
    id: 'visible-doorway-near-object',
    detectedObjects: [
      { id: 'door', name: 'Doorway', confidence: 90, boundingBox: { x: 10, y: 20, width: 20, height: 45 } },
      { id: 'box', name: 'Box', confidence: 88, boundingBox: { x: 31, y: 30, width: 12, height: 20 } },
    ],
    expectedRelations: [
      { relationType: 'doorway-proximity', objectIds: ['door', 'box'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'obstacle-near-visible-destination',
    detectedObjects: [
      { id: 'rug', name: 'Rug', confidence: 88, boundingBox: { x: 20, y: 20, width: 15, height: 15 } },
      { id: 'bed', name: 'Bed', confidence: 90, boundingBox: { x: 40, y: 20, width: 40, height: 35 } },
    ],
    expectedRelations: [
      { relationType: 'obstacle-destination', objectIds: ['rug', 'bed'], evidenceStatus: 'Needs Review' },
    ],
  },
];

const variedSyntheticCases: SpatialEvaluationCase[] = [
  {
    id: 'synthetic-bedroom-night-low-confidence-walkway',
    roomType: 'bedroom',
    cameraAngle: 'low oblique view',
    lighting: 'dim',
    difficulty: 'low confidence detections in a dim scene',
    groundTruthObjects: [
      { id: 'gt-path', name: 'Walking path', confidence: 100, boundingBox: { x: 10, y: 55, width: 80, height: 35 } },
      { id: 'gt-cord', name: 'Electrical cord', confidence: 100, boundingBox: { x: 35, y: 68, width: 25, height: 8 } },
    ],
    detectedObjects: [
      { id: 'det-path', name: 'Walking path', confidence: 58, boundingBox: { x: 10, y: 55, width: 80, height: 35 } },
      { id: 'det-cord', name: 'Electrical cord', confidence: 52, boundingBox: { x: 35, y: 68, width: 25, height: 8 } },
    ],
    expectedRelations: [
      { relationType: 'walkway-overlap', objectIds: ['gt-path', 'gt-cord'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'synthetic-bathroom-high-angle-edge-of-frame',
    roomType: 'bathroom',
    cameraAngle: 'high-angle overview',
    lighting: 'mixed window and ceiling light',
    difficulty: 'partial doorway and object at frame edge',
    groundTruthObjects: [
      { id: 'gt-door', name: 'Doorway', confidence: 100, boundingBox: { x: 5, y: 18, width: 25, height: 65 } },
      { id: 'gt-basket', name: 'Basket', confidence: 100, boundingBox: { x: 27, y: 52, width: 16, height: 22 } },
    ],
    detectedObjects: [
      { id: 'det-door', name: 'Doorway', confidence: 65, boundingBox: { x: 5, y: 18, width: 25, height: 65 } },
      { id: 'det-basket', name: 'Basket', confidence: 62, boundingBox: { x: 27, y: 52, width: 16, height: 22 } },
    ],
    expectedRelations: [
      { relationType: 'doorway-proximity', objectIds: ['gt-door', 'gt-basket'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'synthetic-hallway-missed-cord-detection',
    roomType: 'hallway',
    cameraAngle: 'eye-level perspective',
    lighting: 'bright',
    difficulty: 'occlusion; a labeled cord was missed by the detector',
    groundTruthObjects: [
      { id: 'gt-path', name: 'Walkway', confidence: 100, boundingBox: { x: 8, y: 58, width: 84, height: 32 } },
      { id: 'gt-cord', name: 'Cord', confidence: 100, boundingBox: { x: 38, y: 69, width: 20, height: 7 } },
    ],
    detectedObjects: [
      { id: 'det-path', name: 'Walkway', confidence: 91, boundingBox: { x: 8, y: 58, width: 84, height: 32 } },
    ],
    expectedRelations: [
      { relationType: 'walkway-overlap', objectIds: ['gt-path', 'gt-cord'], evidenceStatus: 'Potential Concern' },
    ],
  },
  {
    id: 'synthetic-kitchen-wide-angle-separated-objects',
    roomType: 'kitchen',
    cameraAngle: 'wide-angle corner view',
    lighting: 'bright backlit window',
    difficulty: 'perspective distortion; distant objects should not be called proximate',
    groundTruthObjects: [
      { id: 'gt-chair', name: 'Chair', confidence: 100, boundingBox: { x: 3, y: 65, width: 18, height: 28 } },
      { id: 'gt-bin', name: 'Storage bin', confidence: 100, boundingBox: { x: 76, y: 25, width: 18, height: 25 } },
    ],
    detectedObjects: [
      { id: 'det-chair', name: 'Chair', confidence: 87, boundingBox: { x: 3, y: 65, width: 18, height: 28 } },
      { id: 'det-bin', name: 'Storage bin', confidence: 89, boundingBox: { x: 76, y: 25, width: 18, height: 25 } },
    ],
    expectedRelations: [],
  },
  {
    id: 'synthetic-living-room-boxed-overlap-ambiguous',
    roomType: 'living room',
    cameraAngle: 'slightly tilted close view',
    lighting: 'uneven lamp lighting',
    difficulty: 'overlapping detections may be occlusion rather than physical contact',
    groundTruthObjects: [
      { id: 'gt-rug', name: 'Rug', confidence: 100, boundingBox: { x: 18, y: 50, width: 55, height: 38 } },
      { id: 'gt-table', name: 'Coffee table', confidence: 100, boundingBox: { x: 39, y: 42, width: 38, height: 36 } },
    ],
    detectedObjects: [
      { id: 'det-rug', name: 'Rug', confidence: 84, boundingBox: { x: 18, y: 50, width: 55, height: 38 } },
      { id: 'det-table', name: 'Coffee table', confidence: 86, boundingBox: { x: 39, y: 42, width: 38, height: 36 } },
    ],
    expectedRelations: [
      { relationType: 'overlap', objectIds: ['gt-rug', 'gt-table'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'synthetic-bedroom-box-jitter-alignment',
    roomType: 'bedroom',
    cameraAngle: 'eye-level oblique',
    lighting: 'moderate',
    difficulty: 'imprecise but usable object bounds',
    groundTruthObjects: [
      { id: 'gt-bed', name: 'Bed', confidence: 100, boundingBox: { x: 24, y: 20, width: 52, height: 58 } },
      { id: 'gt-cord', name: 'Electrical cord', confidence: 100, boundingBox: { x: 72, y: 68, width: 14, height: 8 } },
    ],
    detectedObjects: [
      { id: 'det-bed', name: 'Bed', confidence: 90, boundingBox: { x: 26, y: 19, width: 52, height: 58 } },
      { id: 'det-cord', name: 'Electrical cord', confidence: 75, boundingBox: { x: 71, y: 67, width: 16, height: 9 } },
    ],
    expectedRelations: [
      { relationType: 'obstacle-destination', objectIds: ['gt-cord', 'gt-bed'], evidenceStatus: 'Needs Review' },
    ],
  },
  {
    id: 'synthetic-laundry-room-spurious-detection',
    roomType: 'laundry room',
    cameraAngle: 'wide overview',
    lighting: 'low contrast',
    difficulty: 'false object detection with no annotated counterpart',
    groundTruthObjects: [
      { id: 'gt-door', name: 'Doorway', confidence: 100, boundingBox: { x: 6, y: 12, width: 22, height: 78 } },
    ],
    detectedObjects: [
      { id: 'det-door', name: 'Doorway', confidence: 93, boundingBox: { x: 6, y: 12, width: 22, height: 78 } },
      { id: 'det-bag', name: 'Bag', confidence: 61, boundingBox: { x: 25, y: 55, width: 15, height: 21 } },
    ],
    expectedRelations: [],
  },
  {
    id: 'synthetic-entryway-low-light-cord-path',
    roomType: 'entryway',
    cameraAngle: 'floor-level close-up',
    lighting: 'dim with hard shadows',
    difficulty: 'valid geometry but uncertain model confidence',
    groundTruthObjects: [
      { id: 'gt-path', name: 'Pathway', confidence: 100, boundingBox: { x: 8, y: 60, width: 84, height: 30 } },
      { id: 'gt-cable', name: 'Cable', confidence: 100, boundingBox: { x: 30, y: 68, width: 28, height: 9 } },
    ],
    detectedObjects: [
      { id: 'det-path', name: 'Pathway', confidence: 49, boundingBox: { x: 8, y: 60, width: 84, height: 30 } },
      { id: 'det-cable', name: 'Cable', confidence: 53, boundingBox: { x: 30, y: 68, width: 28, height: 9 } },
    ],
    expectedRelations: [
      { relationType: 'walkway-overlap', objectIds: ['gt-path', 'gt-cable'], evidenceStatus: 'Needs Review' },
    ],
  },
];

export const evalDataset: SpatialEvaluationCase[] = [
  ...originalCases.map((evaluationCase) => ({
    ...evaluationCase,
    roomType: 'synthetic geometry fixture',
    cameraAngle: 'axis-aligned image-coordinate boxes',
    lighting: 'not represented by box-only fixtures',
    difficulty: evaluationCase.difficulty ?? evaluationCase.id,
  })),
  ...variedSyntheticCases,
];
