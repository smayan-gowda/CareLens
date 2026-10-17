export type ImageQualityPreset = "standard" | "hd" | "4k" | "original";

export interface QualityPresetConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  targetMaxKB: number;
}

export const QUALITY_PRESETS: Record<ImageQualityPreset, QualityPresetConfig> = {
  standard: { maxWidth: 1280, maxHeight: 1280, quality: 0.75, targetMaxKB: 250 },
  hd: { maxWidth: 2048, maxHeight: 2048, quality: 0.88, targetMaxKB: 600 },
  "4k": { maxWidth: 3840, maxHeight: 2160, quality: 0.92, targetMaxKB: 1200 },
  original: { maxWidth: 7680, maxHeight: 4320, quality: 0.98, targetMaxKB: 5000 },
};

export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 3840,
  maxHeight = 3840,
  quality = 0.95,
  targetMaxKB = 3000,
  forceRecompress = false
): Promise<string> {
  if (!dataUrl) return "";
  if (!dataUrl.startsWith("data:image")) return dataUrl;

  // Convert target KB to base64 length (~1.35x base64 overhead)
  const targetMaxChars = targetMaxKB * 1024 * 1.35;

  // If already under target size, not forced, and reasonably small (< 100KB), return directly
  if (!forceRecompress && dataUrl.length <= targetMaxChars && dataUrl.length < 120000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(dataUrl);
      }
    }, 4000);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (resolved) return;
      clearTimeout(timer);
      resolved = true;

      let currentWidth = img.width;
      let currentHeight = img.height;

      if (currentWidth > maxWidth || currentHeight > maxHeight) {
        if (currentWidth > currentHeight) {
          currentHeight = Math.round((currentHeight * maxWidth) / currentWidth);
          currentWidth = maxWidth;
        } else {
          currentWidth = Math.round((currentWidth * maxHeight) / currentHeight);
          currentHeight = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);

      let currentQuality = quality;
      let bestCompressed = dataUrl;

      for (let attempt = 0; attempt < 5; attempt++) {
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        ctx = canvas.getContext("2d");
        if (!ctx) break;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

        const compressed = canvas.toDataURL("image/jpeg", currentQuality);
        bestCompressed = compressed;

        if (compressed.length <= targetMaxChars) {
          return resolve(compressed);
        }

        currentWidth = Math.round(currentWidth * 0.88);
        currentHeight = Math.round(currentHeight * 0.88);
        currentQuality = Math.max(0.50, currentQuality - 0.06);
      }

      resolve(bestCompressed.length < dataUrl.length ? bestCompressed : dataUrl);
    };

    img.onerror = () => {
      if (resolved) return;
      clearTimeout(timer);
      resolved = true;
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

export async function compressImageFile(
  file: File,
  maxWidth = 3840,
  maxHeight = 3840,
  quality = 0.95,
  targetMaxKB = 3000,
  preset?: ImageQualityPreset
): Promise<string> {
  if (preset && QUALITY_PRESETS[preset]) {
    const p = QUALITY_PRESETS[preset];
    maxWidth = p.maxWidth;
    maxHeight = p.maxHeight;
    quality = p.quality;
    targetMaxKB = p.targetMaxKB;
  }

  // If set to original, return raw file object URL directly
  if (preset === "original") {
    return URL.createObjectURL(file);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = reader.result as string;
      const compressed = await compressImageDataUrl(rawUrl, maxWidth, maxHeight, quality, targetMaxKB);
      resolve(compressed);
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}


