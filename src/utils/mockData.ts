import { Home, Activity } from '@/types/home';
import { ScanResult } from '@/types/ai';

export const initialScans: Record<string, ScanResult[]> = {
  'room-1': [
    {
      id: 'scan-1',
      roomId: 'room-1',
      homeId: 'home-1',
      images: ['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80'],
      status: 'Completed',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
      safetyScore: 68,
      subScores: {
        accessibility: 75,
        mobility: 80,
        fireSafety: 90,
        lighting: 65,
        organization: 55,
        fallPrevention: 45,
      },
      roomType: 'Bathroom',
      roomConfidence: 98,
      hazards: [
        {
          id: 'haz-1',
          title: 'Slippery Floor Near Tub',
          category: 'Fall Risk',
          severity: 'High',
          confidence: 94,
          description: 'No slip-resistant mat detected outside the bathtub.',
          location: 'Floor area adjacent to tub',
          impact: 'High risk of slipping when exiting the bath with wet feet.',
          objectsInvolved: ['Bathtub', 'Floor'],
          reasoning: 'AI vision detected smooth tile surface without any textured mat or rug in the immediate egress path.',
          boundingBox: { x: 30, y: 70, width: 40, height: 20 },
        },
        {
          id: 'haz-2',
          title: 'Missing Grab Bars',
          category: 'Missing Safety Equipment',
          severity: 'Critical',
          confidence: 99,
          description: 'No grab bars installed near the toilet or in the bathtub.',
          location: 'Bathtub and toilet area',
          impact: 'Increases fall risk significantly for individuals with limited mobility.',
          objectsInvolved: ['Bathtub', 'Toilet Wall'],
          reasoning: 'Standard safety compliance requires grab bars for aging-in-place bathrooms. None detected on visible wall surfaces.',
          boundingBox: { x: 75, y: 40, width: 20, height: 40 },
        }
      ],
      recommendations: [
        {
          id: 'rec-1',
          title: 'Install non-slip bath mat',
          description: 'Place a high-traction, rubber-backed mat outside the tub.',
          priority: 'High',
          estimatedCost: '$20 - $40',
          difficulty: 'Easy',
          expectedImpact: 15,
          whyDetected: 'Smooth tile detected without slip protection.',
          certainty: 95,
          relatedHazardIds: ['haz-1']
        },
        {
          id: 'rec-2',
          title: 'Install ADA-compliant grab bars',
          description: 'Add grab bars inside the shower and next to the toilet. Professional installation recommended to ensure they are anchored to studs.',
          priority: 'Critical',
          estimatedCost: '$150 - $300',
          difficulty: 'Medium',
          expectedImpact: 25,
          whyDetected: 'No grab bars found in high-risk transfer areas.',
          certainty: 99,
          relatedHazardIds: ['haz-2']
        }
      ]
    }
  ]
};

export const initialHomes: Home[] = [
  {
    id: 'home-1',
    userId: 'mock-user',
    name: 'Smith Family Home',
    nickname: 'Mom\'s House',
    address: '123 Maple Street, Portland, OR',
    homeType: 'house',
    yearBuilt: 1985,
    floors: 2,
    description: 'Main residence for Margaret Smith',
    coverImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    rooms: [
      {
        id: 'room-1',
        homeId: 'home-1',
        name: 'Master Bathroom',
        type: 'bathroom',
        floor: 1,
        description: 'Main floor bathroom near the bedroom',
        coverImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        images: [
          {
            id: 'img-1',
            roomId: 'room-1',
            url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
            name: 'bathroom_overview.jpg',
            size: 2450000,
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ]
      },
      {
        id: 'room-2',
        homeId: 'home-1',
        name: 'Living Room',
        type: 'living',
        floor: 1,
        description: 'Main gathering area',
        coverImage: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        images: []
      }
    ]
  },
  {
    id: 'home-2',
    userId: 'mock-user',
    name: 'Johnson Residence',
    nickname: 'Lake House',
    address: '456 Pine Ave, Seattle, WA',
    homeType: 'apartment',
    yearBuilt: 2010,
    floors: 1,
    coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    rooms: []
  }
];

export const initialActivities: Activity[] = [
  {
    id: 'act-1',
    userId: 'mock-user',
    homeId: 'home-1',
    action: 'Uploaded Image',
    description: 'Added a new image to Master Bathroom',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    userId: 'mock-user',
    homeId: 'home-1',
    action: 'Updated Room',
    description: 'Updated details for Living Room',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    userId: 'mock-user',
    homeId: 'home-2',
    action: 'Created Home',
    description: 'Created new home profile for Johnson Residence',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    userId: 'mock-user',
    homeId: 'home-1',
    action: 'Created Home',
    description: 'Created new home profile for Smith Family Home',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
];
