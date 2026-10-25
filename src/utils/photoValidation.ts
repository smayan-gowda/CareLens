export interface PhotoValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  width?: number;
  height?: number;
  brightness?: number; // 0 - 255
}

/**
  * Performs client-side photo pre-validation (dimensions, format, brightness, corruption).
  */
export async function validatePhotoQuality(
  source: File | string
): Promise<PhotoValidationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. File size check if File object
  if (source instanceof File) {
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB
    const minSizeBytes = 5 * 1024; // 5KB
    if (source.size > maxSizeBytes) {
      errors.push("Image file size exceeds 25MB limit. Please choose a smaller photo.");
    } else if (source.size < minSizeBytes) {
      errors.push("Image file appears empty or corrupted (< 5KB).");
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/avif"];
    if (source.type && !validTypes.includes(source.type.toLowerCase())) {
      warnings.push(`File type (${source.type}) may not be supported on all devices.`);
    }
  }

  // 2. Load into Image element and analyze canvas
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    let objectUrl: string | null = null;
    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      const width = img.width;
      const height = img.height;

      // Dimension checks
      if (width < 320 || height < 240) {
        errors.push(`Resolution is too low (${width}x${height}px). Minimum recommended is 400x300px for accurate hazard detection.`);
      } else if (width < 600 || height < 450) {
        warnings.push("Image resolution is slightly low. A clearer, higher-resolution photo will produce better hazard bounding boxes.");
      }

      // Canvas pixel analysis for brightness & corruption
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        // Sample small 100x100 canvas for fast computation
        canvas.width = 100;
        canvas.height = 100;

        if (ctx) {
          ctx.drawImage(img, 0, 0, 100, 100);
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;

          let totalLuminance = 0;
          let minLum = 255;
          let maxLum = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard perceived brightness formula
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;
          }

          const avgBrightness = Math.round(totalLuminance / (data.length / 4));

          if (avgBrightness < 20) {
            warnings.push("Photo appears very dark. Consider turning on room lights or enabling flash for best vision results.");
          } else if (avgBrightness > 240) {
            warnings.push("Photo appears washed out or overexposed. Try adjusting lighting to reduce glare.");
          }

          if (maxLum - minLum < 10) {
            errors.push("Image appears completely solid/blank or severely corrupted.");
          }

          return resolve({
            isValid: errors.length === 0,
            warnings,
            errors,
            width,
            height,
            brightness: avgBrightness,
          });
        }
      } catch (e) {
        // Fallback if CORS or canvas issue
        console.warn("Canvas analysis skipped:", e);
      }

      resolve({
        isValid: errors.length === 0,
        warnings,
        errors,
        width,
        height,
      });
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      errors.push("Failed to load image file. The image may be corrupted or unreadable.");
      resolve({
        isValid: false,
        warnings,
        errors,
      });
    };
  });
}
