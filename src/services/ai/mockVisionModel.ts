import { Hazard, Recommendation, ScanResult } from '@/types/ai';

export const mockAnalyzeRoom = async (
  homeId: string,
  roomId: string,
  images: string[],
  onProgress?: (stage: number, progress: number) => void
): Promise<ScanResult> => {
  // Simulate network delay and processing stages
  const stages = 6;
  const stageDelay = 1500; // 1.5 seconds per stage

  for (let i = 1; i <= stages; i++) {
    if (onProgress) {
      onProgress(i, (i / stages) * 100);
    }
    await new Promise(resolve => setTimeout(resolve, stageDelay));
  }

  // Generate a mock result
  const hazards: Hazard[] = [
    {
      id: 'h1',
      title: 'Loose bath mat',
      category: 'Fall Risk',
      severity: 'Medium',
      confidence: 92,
      description: 'The bathroom may present increased fall risk because the bath mat appears to lack a non-slip backing and is positioned in a frequently used walking area.',
      location: 'Floor near shower',
      impact: 'High risk of slipping when exiting the shower with wet feet.',
      boundingBox: { x: 30, y: 70, width: 40, height: 20 },
      imageId: images[0],
    },
    {
      id: 'h2',
      title: 'No visible grab bar',
      category: 'Missing Safety Equipment',
      severity: 'High',
      confidence: 87,
      description: 'The shower area lacks visible support equipment which is highly recommended for individuals with mobility challenges.',
      location: 'Shower wall',
      impact: 'Lack of support can lead to falls while transitioning in and out of the shower.',
      boundingBox: { x: 70, y: 30, width: 10, height: 40 },
      imageId: images[0],
    },
    {
      id: 'h3',
      title: 'Limited lighting near shower',
      category: 'Poor Lighting',
      severity: 'Medium',
      confidence: 84,
      description: 'The ambient lighting in the shower area appears dim, which can obscure potential slip hazards.',
      location: 'Ceiling above shower',
      impact: 'Reduced visibility increases the likelihood of accidents.',
      boundingBox: { x: 40, y: 10, width: 20, height: 20 },
      imageId: images[0] || images[1],
    },
  ];

  const recommendations: Recommendation[] = [
    {
      id: 'r1',
      title: 'Install grab bar in shower',
      description: 'A professionally installed grab bar will significantly reduce fall risk when entering and exiting the tub/shower.',
      priority: 'High',
      estimatedCost: '$75-$150',
      difficulty: 'Medium',
      expectedImpact: 15,
      relatedHazardIds: ['h2'],
    },
    {
      id: 'r2',
      title: 'Replace bath mat with non-slip alternative',
      description: 'Secure a heavy-duty bath mat with a rubberized, non-slip backing to prevent shifting on wet tile floors.',
      priority: 'Medium',
      estimatedCost: '$20-$40',
      difficulty: 'Easy',
      expectedImpact: 8,
      relatedHazardIds: ['h1'],
    },
    {
      id: 'r3',
      title: 'Improve lighting near shower',
      description: 'Install brighter, water-resistant LED fixtures or add a dedicated light source above the shower area.',
      priority: 'Medium',
      estimatedCost: '$30-$100',
      difficulty: 'Easy',
      expectedImpact: 6,
      relatedHazardIds: ['h3'],
    }
  ];

  const safetyScore = 68;

  return {
    id: `scan_${Date.now()}`,
    roomId,
    homeId,
    images,
    status: 'Completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // Started 5 mins ago
    completedAt: new Date().toISOString(),
    safetyScore,
    hazards,
    recommendations,
  };
};
