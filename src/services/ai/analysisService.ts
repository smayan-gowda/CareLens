import { ScanResult, Hazard, Recommendation } from '@/types/ai';
import { analyzeRoomImage } from './visionAnalyzer';
import { extractHazards } from './safetyAnalyzer';
import { generateRecommendations } from './recommendationGenerator';

async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
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
    const processedImages = await Promise.all(
      images.map(async (img) => {
        if (img.startsWith('blob:')) {
          try {
            return await getBase64FromUrl(img);
          } catch (e) {
            console.error("Failed to convert blob to base64 inside analysisService:", e);
            return img;
          }
        }
        return img;
      })
    );
    
    const base64Image = processedImages[0];
    
    if (onProgress) onProgress(2, 35);
    
    if (onProgress) onProgress(3, 55);

    try {
      const result = await analyzeRoomImage(base64Image, "room");
      
      if (onProgress) onProgress(4, 75);
      
      const scanId = `scan-${Date.now()}`;
      
      if (onProgress) onProgress(5, 90);
      
      const hazards = extractHazards(result, scanId);
      const recommendations = generateRecommendations(result, hazards);
      
      const detectedObjects = result.detectedObjects.map((obj, i) => ({
        id: `obj-${Date.now()}-${i}`,
        name: obj.name,
        confidence: obj.confidence,
        boundingBox: obj.boundingBox
      }));

      if (onProgress) onProgress(6, 100);

      return {
        id: scanId,
        roomId,
        homeId,
        createdAt: new Date().toISOString(),
        images: processedImages,
        status: 'Completed',
        safetyScore: result.overallSafetyScore,
        subScores: result.subScores,
        roomType: result.roomType,
        roomConfidence: result.confidence,
        detectedObjects,
        hazards,
        recommendations
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
};
