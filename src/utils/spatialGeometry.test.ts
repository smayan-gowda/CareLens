import { describe, expect, it } from 'vitest';
import { normalizeBoundingBox } from './spatialGeometry';

describe('normalizeBoundingBox', () => {
  it('keeps valid 0-100 coordinates unchanged', () => {
    const box = { x: 20, y: 30, width: 15, height: 25 };
    expect(normalizeBoundingBox(box)).toEqual(box);
  });

  it('converts fractional and 0-1000 coordinates to 0-100 space', () => {
    expect(normalizeBoundingBox({ x: 0.2, y: 0.3, width: 0.15, height: 0.25 })).toEqual({
      x: 20,
      y: 30,
      width: 15,
      height: 25,
    });
    expect(normalizeBoundingBox({ x: 200, y: 300, width: 150, height: 250 })).toEqual({
      x: 20,
      y: 30,
      width: 15,
      height: 25,
    });
  });

  it('rejects non-finite, empty, negative, and out-of-frame boxes', () => {
    expect(normalizeBoundingBox({ x: Number.NaN, y: 0, width: 10, height: 10 })).toBeNull();
    expect(normalizeBoundingBox({ x: 0, y: 0, width: 0, height: 10 })).toBeNull();
    expect(normalizeBoundingBox({ x: -1, y: 0, width: 10, height: 10 })).toBeNull();
    expect(normalizeBoundingBox({ x: 95, y: 0, width: 10, height: 10 })).toBeNull();
  });
});
