import { ScanResult, Hazard, Recommendation } from "@/types/ai";

export interface SampleRoomAssessment {
  id: string;
  name: string;
  roomType: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  scanResult: ScanResult;
}

export const SAMPLE_ASSESSMENTS: SampleRoomAssessment[] = [
  {
    id: "sample-bathroom-master",
    name: "Master Bathroom",
    roomType: "bathroom",
    subtitle: "Tub Threshold, Tiled Wet Zone & Bath Rug",
    description: "Evaluates slip hazards, unanchored floor coverings, step-in tub thresholds, and missing wall-mounted grab rails in a senior living bathroom.",
    thumbnailUrl: "/src/assets/images/sample_bathroom_assessment_1792872675623.jpg",
    scanResult: {
      id: "sample-bathroom-master",
      roomId: "sample-room-bath",
      homeId: "sample-home-1",
      createdAt: new Date().toISOString(),
      images: ["/src/assets/images/sample_bathroom_assessment_1792872675623.jpg"],
      status: "Completed",
      safetyScore: 65,
      initialSafetyScore: 65,
      roomType: "Bathroom",
      roomConfidence: 96,
      detectedObjects: [
        {
          id: "obj-bath-1",
          name: "Bathtub & Shower",
          confidence: 98,
          boundingBox: { x: 57, y: 10, width: 38, height: 80 }
        },
        {
          id: "obj-bath-2",
          name: "Pedestal Sink",
          confidence: 94,
          boundingBox: { x: 38, y: 40, width: 19, height: 35 }
        },
        {
          id: "obj-bath-3",
          name: "Floor Mat / Rug",
          confidence: 92,
          boundingBox: { x: 44, y: 75, width: 33, height: 24 }
        },
        {
          id: "obj-bath-4",
          name: "Tile Floor",
          confidence: 95,
          boundingBox: { x: 13, y: 58, width: 70, height: 42 }
        }
      ],
      hazards: [
        {
          id: "h-bath-1",
          title: "Unsecured cloth bath mat on glazed tile",
          category: "Trip Hazard",
          severity: "High",
          confidence: 92,
          description: "Cloth mat sits crumpled on smooth ceramic tile immediately adjacent to the tub exit with no visible non-skid backing.",
          location: "Tile floor adjacent to bathtub edge",
          impact: "Unsecured mats on slick tile can slip abruptly underfoot during wet transfers.",
          objectsInvolved: ["Floor Mat / Rug", "Tile Floor"],
          reasoning: "Photo clearly shows lightweight cloth fabric without rubberized bevel edging.",
          boundingBox: { x: 44, y: 75, width: 33, height: 24 },
          humanVerificationNote: "A 2D photo cannot verify whether the underside has rubberized non-slip grip. Check underside physically.",
          suggestedAction: "Replace with an ADA-compliant suction-backed rubber wet mat or apply non-skid mesh backing.",
          feedback: "helpful"
        },
        {
          id: "h-bath-2",
          title: "Absence of wall-mounted safety grab bars",
          category: "Missing Safety Equipment",
          severity: "Critical",
          confidence: 95,
          description: "Tiled wall surrounding the bathtub and shower entry lacks structural support handles or ADA grab bars.",
          location: "Bathtub surround wall and shower entry",
          impact: "Bathers may instinctively grab fragile towel bars or shower curtains if balance is lost.",
          objectsInvolved: ["Bathtub & Shower"],
          reasoning: "Towel rack on right door trim is decorative and will pull out under body weight.",
          boundingBox: { x: 70, y: 20, width: 25, height: 45 },
          humanVerificationNote: "Wall stud integrity and plumbing clearance must be inspected in person before mounting hardware.",
          suggestedAction: "Hire a licensed contractor to install two 18-36 inch stainless steel grab bars anchored directly to wall studs.",
          feedback: "helpful"
        },
        {
          id: "h-bath-3",
          title: "Stepped tub lip requiring single-leg balance transfer",
          category: "Fall Risk",
          severity: "Medium",
          confidence: 88,
          description: "Cutout threshold remains approximately 6 inches above floor level, requiring lifting legs while stepping on slick tile.",
          location: "Outer bathtub threshold barrier",
          impact: "Requires single-leg standing balance on potentially wet tile when entering or exiting.",
          objectsInvolved: ["Bathtub & Shower"],
          reasoning: "Step-over movement forces center of gravity shift without steady hand support nearby.",
          boundingBox: { x: 57, y: 50, width: 25, height: 35 },
          humanVerificationNote: "Evaluate user's specific hip mobility and leg clearance with an occupational therapist.",
          suggestedAction: "Add a weighted transfer bench or non-skid step platform alongside the outer tub threshold.",
          feedback: "helpful"
        }
      ],
      recommendations: [
        {
          id: "r-bath-1",
          title: "Mount wall-anchored ADA grab bars",
          description: "Install 1.5-inch diameter textured grab bars rated for 300+ lbs directly into wall framing at 33-36 inches height.",
          priority: "Critical",
          estimatedCost: "$150 - $320",
          difficulty: "Medium",
          expectedImpact: 15,
          whyDetected: "No weight-bearing support handles detected in active wet area.",
          objectsInvolved: ["Bathtub & Shower"],
          certainty: 95,
          falsePositivePossible: false,
          relatedHazardIds: ["h-bath-2"]
        },
        {
          id: "r-bath-2",
          title: "Deploy high-friction ADA non-slip bath mat",
          description: "Remove the crumpled cloth towel and replace with a commercial textured rubber mat with suction anchors.",
          priority: "High",
          estimatedCost: "$25 - $50",
          difficulty: "Easy",
          expectedImpact: 10,
          whyDetected: "Loose cloth rug observed on slick glazed ceramic flooring.",
          objectsInvolved: ["Floor Mat / Rug"],
          certainty: 92,
          falsePositivePossible: false,
          relatedHazardIds: ["h-bath-1"]
        },
        {
          id: "r-bath-3",
          title: "Position dual-side bath transfer bench",
          description: "Place a slip-resistant transfer bench that spans the tub lip, allowing seated transfers without single-leg balancing.",
          priority: "Medium",
          estimatedCost: "$65 - $140",
          difficulty: "Easy",
          expectedImpact: 5,
          whyDetected: "6-inch threshold requires single-leg balancing upon tub exit.",
          objectsInvolved: ["Bathtub & Shower"],
          certainty: 88,
          falsePositivePossible: false,
          relatedHazardIds: ["h-bath-3"]
        }
      ],
      subScores: {
        accessibility: 60,
        mobility: 55,
        fireSafety: 90,
        lighting: 75,
        organization: 80,
        fallPrevention: 55
      }
    }
  },
  {
    id: "sample-bedroom-primary",
    name: "Primary Bedroom",
    roomType: "bedroom",
    subtitle: "Nightstand Cord, Runner Rug & Transfer Clearance",
    description: "Evaluates nocturnal pathway illumination, trailing electrical wiring, unsecured runner rugs, and bedside clearance on hardwood floors.",
    thumbnailUrl: "/src/assets/images/sample_bedroom_assessment_1792872676148.jpg",
    scanResult: {
      id: "sample-bedroom-primary",
      roomId: "sample-room-bed",
      homeId: "sample-home-1",
      createdAt: new Date().toISOString(),
      images: ["/src/assets/images/sample_bedroom_assessment_1792872676148.jpg"],
      status: "Completed",
      safetyScore: 73,
      initialSafetyScore: 73,
      roomType: "Bedroom",
      roomConfidence: 98,
      detectedObjects: [
        {
          id: "obj-bed-1",
          name: "Bed Frame & Mattress",
          confidence: 99,
          boundingBox: { x: 25, y: 19, width: 73, height: 68 }
        },
        {
          id: "obj-bed-2",
          name: "Nightstand Table",
          confidence: 96,
          boundingBox: { x: 11, y: 46, width: 23, height: 35 }
        },
        {
          id: "obj-bed-3",
          name: "Table Lamp & Cord",
          confidence: 94,
          boundingBox: { x: 12, y: 17, width: 14, height: 60 }
        },
        {
          id: "obj-bed-4",
          name: "Bedside Runner Rug",
          confidence: 92,
          boundingBox: { x: 21, y: 71, width: 78, height: 28 }
        }
      ],
      hazards: [
        {
          id: "h-bed-1",
          title: "Trailing lamp power cord crossing transfer floorway",
          category: "Trip Hazard",
          severity: "High",
          confidence: 96,
          description: "Long dark electrical cord drapes from the nightstand lamp across the open hardwood floor directly in the nocturnal walking path.",
          location: "Floor between bedside and room door",
          impact: "Loose cords easily catch walker wheels, cane tips, or slippers during low-light night visits.",
          objectsInvolved: ["Table Lamp & Cord", "Nightstand Table"],
          reasoning: "Cord is clearly draped across bare floorboards without clip channels or baseboard routing.",
          boundingBox: { x: 13, y: 52, width: 42, height: 42 },
          humanVerificationNote: "Verify plug load and outlet location before securing cord along baseboard perimeter.",
          suggestedAction: "Fasten cord along nightstand leg and baseboard using adhesive clips, or use a wireless touch lamp.",
          feedback: "helpful"
        },
        {
          id: "h-bed-2",
          title: "Unsecured woven runner rug over polished wood",
          category: "Trip Hazard",
          severity: "High",
          confidence: 90,
          description: "Woven runner with tasselled edges lies flat over smooth hardwood directly where feet land when stepping out of bed.",
          location: "Bedside floor along length of mattress",
          impact: "Unanchored rugs can bunch, curl at edges, or slide sideways during standing transfers.",
          objectsInvolved: ["Bedside Runner Rug"],
          reasoning: "Tassels and edge curling visible without perimeter floor adhesive.",
          boundingBox: { x: 21, y: 71, width: 78, height: 28 },
          humanVerificationNote: "Check if non-slip underlayment is already installed underneath; if so, verify its grip.",
          suggestedAction: "Apply heavy-duty silicone rug gripper tape along edges or roll up runner rug completely.",
          feedback: "helpful"
        },
        {
          id: "h-bed-3",
          title: "Lack of automatic floor-level nocturnal lighting",
          category: "Poor Lighting",
          severity: "Medium",
          confidence: 86,
          description: "Pathway relies on manually reaching for a high table switch in the dark; no motion-sensing guide lights detected.",
          location: "Baseboards along bed to doorway pathway",
          impact: "Getting out of bed in total darkness increases disorientation and balance loss before light can be turned on.",
          objectsInvolved: ["Table Lamp & Cord", "Bed Frame & Mattress"],
          reasoning: "Only a single high-profile switch lamp observed beside bed.",
          boundingBox: { x: 12, y: 17, width: 14, height: 35 },
          humanVerificationNote: "Inspect outlet availability near baseboards for plug-in LED nightlights.",
          suggestedAction: "Install an under-bed motion-sensor amber LED light strip that illuminates the floor upon swinging feet down.",
          feedback: "helpful"
        }
      ],
      recommendations: [
        {
          id: "r-bed-1",
          title: "Secure electrical cords with baseboard channel",
          description: "Clip the nightstand lamp cable tight against the rear furniture leg and guide along baseboard using rubber raceway.",
          priority: "High",
          estimatedCost: "$10 - $25",
          difficulty: "Easy",
          expectedImpact: 10,
          whyDetected: "Unsecured cable crossing active walkway beside nightstand.",
          objectsInvolved: ["Table Lamp & Cord"],
          certainty: 96,
          falsePositivePossible: false,
          relatedHazardIds: ["h-bed-1"]
        },
        {
          id: "r-bed-2",
          title: "Anchor or remove bedside runner rug",
          description: "Install non-slip rug grip underpad or adhere silicone corner grips to prevent curling and sliding on wood floor.",
          priority: "High",
          estimatedCost: "$15 - $35",
          difficulty: "Easy",
          expectedImpact: 10,
          whyDetected: "Woven runner on polished hardwood without visible edge bonding.",
          objectsInvolved: ["Bedside Runner Rug"],
          certainty: 90,
          falsePositivePossible: false,
          relatedHazardIds: ["h-bed-2"]
        },
        {
          id: "r-bed-3",
          title: "Install motion-activated under-bed light strip",
          description: "Affix warm amber LED strip beneath bed rail that automatically illuminates flooring when feet touch the floor.",
          priority: "Medium",
          estimatedCost: "$25 - $60",
          difficulty: "Easy",
          expectedImpact: 7,
          whyDetected: "No automatic low-level pathway lighting for nighttime trips.",
          objectsInvolved: ["Bed Frame & Mattress"],
          certainty: 86,
          falsePositivePossible: false,
          relatedHazardIds: ["h-bed-3"]
        }
      ],
      subScores: {
        accessibility: 78,
        mobility: 74,
        fireSafety: 85,
        lighting: 68,
        organization: 82,
        fallPrevention: 70
      }
    }
  }
];

export function getSampleAssessment(id: string): SampleRoomAssessment | undefined {
  return SAMPLE_ASSESSMENTS.find(
    (s) => s.id === id || s.scanResult.id === id || s.roomType.toLowerCase() === id.toLowerCase()
  );
}
