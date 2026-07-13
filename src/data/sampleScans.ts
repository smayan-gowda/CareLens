export interface SampleHazard {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
}

export interface SampleRecommendation {
  id: string;
  title: string;
  estimatedCost: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

export interface SampleScan {
  id: string;
  roomType: string;
  safetyScore: number;
  createdAt: string;
  hazards: SampleHazard[];
  recommendations: SampleRecommendation[];
}

export const SAMPLE_SCANS: SampleScan[] = [
  {
    id: "sample_bathroom",
    roomType: "bathroom",
    safetyScore: 62,
    createdAt: new Date().toISOString(),
    hazards: [
      { id: "h1", title: "Slippery Tile Flooring", severity: "High", description: "Wet ceramic tiles pose a significant slip and fall risk without specialized high-friction coating." },
      { id: "h2", title: "No Shower Grab Bars", severity: "Critical", description: "Lacks secure ADA-approved handrails inside the active bathing area." },
      { id: "h3", title: "Dim Pathway & Vanity Lighting", severity: "Medium", description: "Poor bathroom illumination increases night-time tripping and disorientation." }
    ],
    recommendations: [
      { id: "r1", title: "Install Bath Grab Bars", estimatedCost: "$150 - $300", difficulty: "Easy", description: "Securely mount wall-anchored safety handles beside the tub and toilet." },
      { id: "r2", title: "Lay Textured Non-Slip Tile", estimatedCost: "$800 - $2,500", difficulty: "Medium", description: "Replace slick bathroom tiling with a high-friction, textured ADA wetroom surface." },
      { id: "r3", title: "Install Motion LED Pathway Light", estimatedCost: "$40 - $120", difficulty: "Easy", description: "Install automatic nightlights to brightly guide pathways during nocturnal visits." }
    ]
  },
  {
    id: "sample_kitchen",
    roomType: "kitchen",
    safetyScore: 71,
    createdAt: new Date().toISOString(),
    hazards: [
      { id: "h4", title: "Over-Extension Cabinet Reach", severity: "Medium", description: "Upper cabinets require unsafe stepping stools or strain to access standard cookware." },
      { id: "h5", title: "Slick Polished Hardwood", severity: "High", description: "Wood flooring near the sink lacks water drainage and gets highly slick when wet." },
      { id: "h6", title: "GFCI Protection Absent", severity: "Critical", description: "Electric sockets within 6 feet of running water sources lack auto-shutoff safety switches." }
    ],
    recommendations: [
      { id: "r4", title: "Mount Pull-Down Cabinets", estimatedCost: "$400 - $1,200", difficulty: "Medium", description: "Retrofit existing upper cabinets with hydraulic pull-down slides for safe accessibility." },
      { id: "r5", title: "Add Rubber Sink Splash Mats", estimatedCost: "$25 - $60", difficulty: "Easy", description: "Lay textured anti-fatigue drainage mats in high-moisture sink work areas." },
      { id: "r6", title: "Upgrade to GFCI Outlets", estimatedCost: "$100 - $250", difficulty: "Easy", description: "Replace standard outlets near the sink with modern GFCI ground-fault protection breakers." }
    ]
  }
];
