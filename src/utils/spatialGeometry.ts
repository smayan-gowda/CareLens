import type { BoundingBox } from '@/types/ai';

export function normalizeBoundingBox(box: BoundingBox | undefined): BoundingBox | null {
  if (
    !box ||
    !Number.isFinite(box.x) ||
    !Number.isFinite(box.y) ||
    !Number.isFinite(box.width) ||
    !Number.isFinite(box.height)
  ) {
    return null;
  }

  let normalized = box;
  if (box.x <= 1 && box.y <= 1 && box.width <= 1 && box.height <= 1 && box.width > 0) {
    normalized = {
      x: box.x * 100,
      y: box.y * 100,
      width: box.width * 100,
      height: box.height * 100,
    };
  } else if (box.x > 100 || box.y > 100 || box.width > 100 || box.height > 100) {
    normalized = {
      x: box.x / 10,
      y: box.y / 10,
      width: box.width / 10,
      height: box.height / 10,
    };
  }

  if (
    normalized.x < 0 ||
    normalized.y < 0 ||
    normalized.width <= 0 ||
    normalized.height <= 0 ||
    normalized.x + normalized.width > 100 ||
    normalized.y + normalized.height > 100
  ) {
    return null;
  }

  return normalized;
}
