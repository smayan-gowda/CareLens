import type { DetectedObject, SpatialEvidenceStatus, SpatialRelationType } from '@/types/ai';

export interface ExpectedSpatialRelation {
  relationType: SpatialRelationType;
  objectIds: string[];
  evidenceStatus: SpatialEvidenceStatus;
}

export interface SpatialEvaluationCase {
  id: string;
  detectedObjects: DetectedObject[];
  expectedRelations: ExpectedSpatialRelation[];
}

export const evalDataset: SpatialEvaluationCase[] = [
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
