import { describe, expect, it } from 'vitest';
import { validateSafetyAnalysis } from './analysisValidation';
import type { SafetyAnalysis } from './schemas';

const validAnalysis: SafetyAnalysis = {
  roomType: 'Living room',
  confidence: 84,
  overallSafetyScore: 76,
  subScores: {
    accessibility: 70,
    mobility: 75,
    fireSafety: 80,
    lighting: 78,
    organization: 72,
    fallPrevention: 81,
  },
  detectedObjects: [{
    name: 'cord',
    confidence: 90,
    boundingBox: { x: 20, y: 30, width: 10, height: 8 },
  }],
  hazards: [{
    title: 'Cord across walking area',
    category: 'Trip Hazard',
    severity: 'Medium',
    description: 'A cord is visible on the floor.',
    visibleObservation: 'A dark cable crosses the visible floor area.',
    location: 'Floor',
    confidence: 82,
    objectsInvolved: ['cord'],
    reasoning: 'The cord is visibly on the floor.',
    boundingBox: { x: 20, y: 30, width: 10, height: 8 },
  }],
  recommendations: [{
    title: 'Route the cord away from the walking area',
    description: 'Consider securing the cord along a wall.',
    priority: 'soon',
    estimatedCost: { min: 0, max: 20 },
    expectedImpact: 45,
    whyDetected: 'A cord is visible on the floor.',
    objectsInvolved: ['cord'],
    certainty: 75,
    falsePositivePossible: true,
  }],
};

describe('validateSafetyAnalysis', () => {
  it('accepts complete analysis output while dropping unrecognized fields', () => {
    const result = validateSafetyAnalysis({ ...validAnalysis, privateProviderField: 'ignored' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validAnalysis);
      expect('privateProviderField' in result.data).toBe(false);
    }
  });

  it('rejects non-finite scores and invalid geometry with safe field-level issues', () => {
    const invalid = {
      ...validAnalysis,
      confidence: Number.NaN,
      detectedObjects: [{
        ...validAnalysis.detectedObjects[0],
        boundingBox: { x: 0, y: 0, width: -1, height: 4 },
      }],
    };
    const result = validateSafetyAnalysis(invalid);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.issues).toEqual(expect.arrayContaining([
        { field: 'confidence', code: 'invalid_type' },
        { field: 'detectedObjects.0.boundingBox.width', code: 'too_small' },
      ]));
      expect(JSON.stringify(result.issues)).not.toContain('NaN');
    }
  });
});
