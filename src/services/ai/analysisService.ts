import { ScanResult, Hazard, Recommendation } from '@/types/ai';
import { analyzeRoomImage } from './visionAnalyzer';
import { extractHazards } from './safetyAnalyzer';
import { generateRecommendations } from './recommendationGenerator';
import { compressImageDataUrl } from '@/utils/imageCompression';
import { getScoreFormulaBreakdown } from '@/components/reports/reportMath';
import { analyzeSpatialRelationships } from './spatialAnalyzer';

async function getBase64FromUrl(url: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const results: string[] = [];
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const MAX_SIZE = 1000;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      // 1. Full image
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not found'));
      
      ctx.drawImage(img, 0, 0, width, height);
      results.push(canvas.toDataURL('image/jpeg', 0.6));
      
      // 2-5. Quadrants (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
      const quadWidth = width / 2;
      const quadHeight = height / 2;
      canvas.width = quadWidth;
      canvas.height = quadHeight;
      const qCtx = canvas.getContext('2d');
      if (!qCtx) return reject(new Error('Canvas context not found'));
      
      // Top Left
      qCtx.drawImage(img, 0, 0, img.width / 2, img.height / 2, 0, 0, quadWidth, quadHeight);
      results.push(canvas.toDataURL('image/jpeg', 0.8));
      
      // Top Right
      qCtx.drawImage(img, img.width / 2, 0, img.width / 2, img.height / 2, 0, 0, quadWidth, quadHeight);
      results.push(canvas.toDataURL('image/jpeg', 0.8));
      
      // Bottom Left
      qCtx.drawImage(img, 0, img.height / 2, img.width / 2, img.height / 2, 0, 0, quadWidth, quadHeight);
      results.push(canvas.toDataURL('image/jpeg', 0.8));
      
      // Bottom Right
      qCtx.drawImage(img, img.width / 2, img.height / 2, img.width / 2, img.height / 2, 0, 0, quadWidth, quadHeight);
      results.push(canvas.toDataURL('image/jpeg', 0.8));
      
      resolve(results);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const analysisService = {
  analyzeRoom: async (
    homeId: string,
    roomId: string,
    images: string[], // URLs or Object URLs
    onProgress?: (stage: number, progress: number) => void
  ): Promise<ScanResult> => {
    
    if (onProgress) onProgress(1, 15);
    
    // Process all images to base64 if they are client-side blob URLs
    const processedImagesArrays = await Promise.all(
      images.map(async (img) => {
        if (img.startsWith('blob:')) {
          try {
            return await getBase64FromUrl(img);
          } catch (e) {
            console.error("Failed to convert blob to base64 inside analysisService:", e);
            return [img];
          }
        }
        return [img];
      })
    );
    
    // Flatten array of arrays
    const processedImages = processedImagesArrays.flat();
    
    if (onProgress) onProgress(2, 35);
    if (onProgress) onProgress(3, 55);

    try {
      const result = await analyzeRoomImage(processedImages, "room");
      
      if (onProgress) onProgress(4, 75);
      
      const scanId = `scan-${Date.now()}`;
      
      if (onProgress) onProgress(5, 90);
      
      const detectedObjects = result.detectedObjects.map((obj, i) => ({
        id: `obj-${Date.now()}-${i}`,
        name: obj.name,
        confidence: obj.confidence,
        boundingBox: obj.boundingBox
      }));

      const hazards = extractHazards(result, scanId);
      const recommendations = generateRecommendations(result, hazards);
      const spatialFindings = analyzeSpatialRelationships(detectedObjects);

      if (onProgress) onProgress(6, 100);

      const savedImage = await compressImageDataUrl(processedImages[0], 1280, 1280, 0.75, 250);

      // Compute deterministic score based on detected hazards
      const scoreBreakdown = getScoreFormulaBreakdown(hazards);
      const deterministicSafetyScore = scoreBreakdown.calculatedScore;

      return {
        id: scanId,
        roomId,
        homeId,
        createdAt: new Date().toISOString(),
        images: [savedImage],
        status: 'Completed',
        safetyScore: deterministicSafetyScore,
        initialSafetyScore: deterministicSafetyScore,
        subScores: result.subScores,
        roomType: result.roomType,
        roomConfidence: result.confidence,
        detectedObjects,
        spatialFindings,
        hazards,
        recommendations,
        assessmentTrace: {
          model: 'gemma-4-31b-it',
          rulesVersion: '2.4.0',
          evaluatedAt: new Date().toISOString(),
          imageId: scanId,
          engineVersion: 'carelens-vision-v2',
        },
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
};
