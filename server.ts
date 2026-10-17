import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { HfInference } from "@huggingface/inference";
import { WebSocketServer } from "ws";
import { ROOM_ANALYSIS_PROMPT } from "./src/services/ai/prompts";

async function safeGenerateContent(ai: GoogleGenAI, params: any) {
  const modelsToTry = [
    "gemma-4-31b-it",
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-2.0-flash"
  ];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      return await ai.models.generateContent({
        ...params,
        model: modelName
      });
    } catch (err: any) {
      console.warn(`[AI Model Fallback] Model ${modelName} failed or quota reached:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

async function safeTranscribeAudio(ai: GoogleGenAI, wavBase64: string, promptText: string): Promise<string> {
  const audioModels = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];

  for (const modelName of audioModels) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: [
          { inlineData: { mimeType: "audio/wav", data: wavBase64 } },
          { text: promptText }
        ]
      });
      const text = res.text?.trim();
      if (text && !text.toLowerCase().includes("[silence]") && !text.toLowerCase().includes("[no speech]")) {
        return text;
      }
    } catch (err: any) {
      console.warn(`[Audio Transcribe] Model ${modelName} failed:`, err?.message || err);
    }
  }
  return "";
}

function getFallbackRoomAnalysis(roomType: string = "Bathroom"): any {
  const normalizedType = (roomType || "Bathroom").trim().toLowerCase();
  
  if (normalizedType.includes("bath")) {
    return {
      roomType: "Bathroom",
      confidence: 95,
      overallSafetyScore: 65,
      subScores: {
        accessibility: 60,
        mobility: 55,
        fireSafety: 85,
        lighting: 70,
        organization: 80,
        fallPrevention: 50
      },
      detectedObjects: [
        { name: "Shower", confidence: 98, boundingBox: { x: 5, y: 15, width: 45, height: 75 } },
        { name: "Toilet", confidence: 95, boundingBox: { x: 55, y: 40, width: 25, height: 45 } },
        { name: "Sink Counter", confidence: 92, boundingBox: { x: 80, y: 35, width: 18, height: 50 } },
        { name: "Bath Mat", confidence: 88, boundingBox: { x: 15, y: 75, width: 30, height: 15 } }
      ],
      hazards: [
        {
          title: "Slippery wet floor near tub/shower",
          category: "Fall Risk",
          severity: "High",
          description: "No dedicated high-traction surface or non-slip mat is visible in the active tub/shower area, creating a high slip hazard when wet.",
          location: "Shower/Tub floor",
          confidence: 90,
          objectsInvolved: ["Shower", "Bath Mat"],
          reasoning: "Water on tiled bathroom floors significantly reduces traction, making it extremely easy for senior residents to slip when exiting.",
          boundingBox: { x: 10, y: 65, width: 40, height: 25 }
        },
        {
          title: "Missing grab bars near toilet",
          category: "Missing Safety Equipment",
          severity: "High",
          description: "There are no sturdy handrails or grab bars mounted near the toilet area to assist with sitting down or standing up.",
          location: "Wall adjacent to toilet",
          confidence: 92,
          objectsInvolved: ["Toilet"],
          reasoning: "The toilet area requires substantial core and lower body strength to use safely. A lack of support can lead to loss of balance or muscle strain.",
          boundingBox: { x: 50, y: 30, width: 15, height: 35 }
        },
        {
          title: "Missing shower grab bars",
          category: "Missing Safety Equipment",
          severity: "High",
          description: "The primary shower enclosure lacks visible heavy-duty wall-mounted grab bars for balance and stabilization.",
          location: "Shower enclosure wall",
          confidence: 95,
          objectsInvolved: ["Shower"],
          reasoning: "Moving inside a wet shower requires reliable physical support. Towel bars or glass doors are not designed to support body weight and can fail.",
          boundingBox: { x: 15, y: 20, width: 10, height: 45 }
        }
      ],
      recommendations: [
        {
          title: "Install heavy-duty grab bars in shower",
          description: "Mount ADA-compliant textured metal grab bars on the stud-walls inside the shower enclosure at 33-36 inches height to provide active leverage and balance support.",
          priority: "immediate",
          estimatedCost: { min: 80, max: 200 },
          expectedImpact: 20,
          whyDetected: "Identified a complete absence of wall-mounted support bars in the wet zone.",
          objectsInvolved: ["Shower"],
          certainty: 95,
          falsePositivePossible: false
        },
        {
          title: "Mount wall-supported grab bar next to toilet",
          description: "Install a wall-mounted flip-up or fixed safety rail next to the toilet to assist with safe transfers, reducing strain on knees and hips.",
          priority: "immediate",
          estimatedCost: { min: 60, max: 150 },
          expectedImpact: 15,
          whyDetected: "The toilet area lacks adjacent vertical or horizontal hand support rails.",
          objectsInvolved: ["Toilet"],
          certainty: 92,
          falsePositivePossible: false
        },
        {
          title: "Introduce commercial-grade non-slip shower mat",
          description: "Place a high-suction, mildew-resistant textured rubber mat inside the shower floor and a secure non-slip backing rug outside.",
          priority: "soon",
          estimatedCost: { min: 20, max: 45 },
          expectedImpact: 12,
          whyDetected: "Smooth flooring visible inside the wet area without any textured traction treatment.",
          objectsInvolved: ["Shower", "Bath Mat"],
          certainty: 90,
          falsePositivePossible: false
        }
      ]
    };
  } else if (normalizedType.includes("kitchen")) {
    return {
      roomType: "Kitchen",
      confidence: 95,
      overallSafetyScore: 70,
      subScores: {
        accessibility: 65,
        mobility: 70,
        fireSafety: 60,
        lighting: 65,
        organization: 75,
        fallPrevention: 75
      },
      detectedObjects: [
        { name: "Stove / Cooktop", confidence: 98, boundingBox: { x: 10, y: 40, width: 25, height: 45 } },
        { name: "Refrigerator", confidence: 96, boundingBox: { x: 75, y: 15, width: 20, height: 75 } },
        { name: "Upper Cabinets", confidence: 93, boundingBox: { x: 5, y: 5, width: 65, height: 25 } },
        { name: "Kitchen Sink", confidence: 90, boundingBox: { x: 45, y: 45, width: 20, height: 35 } }
      ],
      hazards: [
        {
          title: "High-reach cabinet storage storage",
          category: "Accessibility Barrier",
          severity: "Medium",
          description: "Frequently used items appear stored in deep upper cabinets, necessitating reaching high or using unsafe step stools.",
          location: "Upper cabinets above counter",
          confidence: 85,
          objectsInvolved: ["Upper Cabinets"],
          reasoning: "Reaching above shoulder height can cause loss of balance or shoulder injury, while climbing stools poses a severe fall risk for seniors.",
          boundingBox: { x: 10, y: 5, width: 50, height: 20 }
        },
        {
          title: "No visible fire extinguisher nearby",
          category: "Missing Safety Equipment",
          severity: "High",
          description: "The cooking area does not have a dedicated Class B/C fire extinguisher within immediate reach.",
          location: "Near stove and entry point",
          confidence: 90,
          objectsInvolved: ["Stove / Cooktop"],
          reasoning: "Kitchens are the primary origin of home fires. A lack of ready fire suppression equipment increases risk of severe injury and property damage.",
          boundingBox: { x: 5, y: 35, width: 10, height: 20 }
        },
        {
          title: "Inadequate under-cabinet task lighting",
          category: "Poor Lighting",
          severity: "Medium",
          description: "Shadows are visible beneath the upper wall cabinets, reducing visibility on primary food preparation counter spaces.",
          location: "Countertop area below cabinets",
          confidence: 88,
          objectsInvolved: ["Upper Cabinets"],
          reasoning: "Working with knives, appliances, or hot items in shadowed counter spaces significantly increases the risk of cuts, burns, or misjudgments.",
          boundingBox: { x: 15, y: 30, width: 45, height: 15 }
        }
      ],
      recommendations: [
        {
          title: "Reorganize cabinetry to lower shelves",
          description: "Move all daily-use dishes, spices, food, and heavy cookware down to waist-height shelves or pull-out base cabinet drawers to eliminate high reaching.",
          priority: "soon",
          estimatedCost: { min: 0, max: 0 },
          expectedImpact: 14,
          whyDetected: "Frequently used culinary items are stored in high, hard-to-reach upper cabinetry.",
          objectsInvolved: ["Upper Cabinets"],
          certainty: 90,
          falsePositivePossible: false
        },
        {
          title: "Install a kitchen fire extinguisher and bracket",
          description: "Mount a lightweight, easy-to-use Class B:C dry chemical fire extinguisher near the kitchen exit, away from but within easy reach of the stove.",
          priority: "immediate",
          estimatedCost: { min: 25, max: 60 },
          expectedImpact: 18,
          whyDetected: "No visible fire suppression equipment in the food preparation area.",
          objectsInvolved: ["Stove / Cooktop"],
          certainty: 92,
          falsePositivePossible: false
        },
        {
          title: "Add LED under-cabinet strip lighting",
          description: "Install bright, dimmable adhesive LED under-cabinet strip lights to directly illuminate countertop preparation workspaces.",
          priority: "soon",
          estimatedCost: { min: 15, max: 50 },
          expectedImpact: 10,
          whyDetected: "Dim countertops cast in shadow by upper wall-mounted cabinets.",
          objectsInvolved: ["Upper Cabinets"],
          certainty: 88,
          falsePositivePossible: false
        }
      ]
    };
  } else if (normalizedType.includes("bed")) {
    return {
      roomType: "Bedroom",
      confidence: 95,
      overallSafetyScore: 72,
      subScores: {
        accessibility: 70,
        mobility: 75,
        fireSafety: 90,
        lighting: 65,
        organization: 80,
        fallPrevention: 60
      },
      detectedObjects: [
        { name: "Bed", confidence: 99, boundingBox: { x: 15, y: 35, width: 55, height: 50 } },
        { name: "Nightstand", confidence: 95, boundingBox: { x: 75, y: 45, width: 18, height: 35 } },
        { name: "Area Rug", confidence: 90, boundingBox: { x: 25, y: 70, width: 45, height: 25 } }
      ],
      hazards: [
        {
          title: "Loose area rug next to bed",
          category: "Trip Hazard",
          severity: "High",
          description: "A loose area rug is present along the side of the bed. Its edges may curl up, creating a significant catch or trip hazard when waking up or during nighttime transfers.",
          location: "Floor beside bed",
          confidence: 92,
          objectsInvolved: ["Area Rug", "Bed"],
          reasoning: "Unsecured rugs slide easily on hardwood or carpet, leading to balance loss when taking initial steps in the morning.",
          boundingBox: { x: 20, y: 72, width: 50, height: 20 }
        },
        {
          title: "Lack of immediate bedside path lighting",
          category: "Poor Lighting",
          severity: "Medium",
          description: "No automatic nighttime path lighting is visible to illuminate the walk from the bedside to the doorway or bathroom.",
          location: "Pathways around bed",
          confidence: 88,
          objectsInvolved: ["Nightstand", "Bed"],
          reasoning: "Seniors waking up in complete darkness frequently misjudge furniture positions or trip over low obstacles while searching for a light switch.",
          boundingBox: { x: 70, y: 55, width: 25, height: 40 }
        },
        {
          title: "Bed height mismatch",
          category: "Fall Risk",
          severity: "Medium",
          description: "The bed surface appears exceptionally high or low relative to normal seating height, complicating independent sitting and standing transfers.",
          location: "Bed surface",
          confidence: 82,
          objectsInvolved: ["Bed"],
          reasoning: "If a bed is too high, feet cannot touch the floor; if too low, standing up requires excessive knee and hip leverage, causing falls.",
          boundingBox: { x: 20, y: 45, width: 45, height: 25 }
        }
      ],
      recommendations: [
        {
          title: "Secure or remove bedside area rug",
          description: "Remove the loose area rug entirely, or secure all edges firmly to the floor using heavy-duty, double-sided rug tape or an anti-slip mesh underlayment.",
          priority: "immediate",
          estimatedCost: { min: 10, max: 30 },
          expectedImpact: 16,
          whyDetected: "Detected unsecured throw rug edges along the direct transfer pathway.",
          objectsInvolved: ["Area Rug"],
          certainty: 94,
          falsePositivePossible: false
        },
        {
          title: "Install motion-sensor bedside LED nightlights",
          description: "Plug in smart, low-profile motion-activated LED nightlights along the floorboards from the bed to the bedroom door and bathroom.",
          priority: "soon",
          estimatedCost: { min: 12, max: 25 },
          expectedImpact: 12,
          whyDetected: "Pathways from bedside are dark and depend entirely on reaching for a desk lamp.",
          objectsInvolved: ["Nightstand", "Bed"],
          certainty: 90,
          falsePositivePossible: false
        },
        {
          title: "Assess and adjust bed frame height",
          description: "Ensure bed height (including mattress) is between 18-22 inches from the floor, allowing the user's feet to rest flat when sitting on the edge.",
          priority: "soon",
          estimatedCost: { min: 0, max: 100 },
          expectedImpact: 10,
          whyDetected: "Bed height appears non-standard compared to typical safe ergonomic parameters.",
          objectsInvolved: ["Bed"],
          certainty: 80,
          falsePositivePossible: true
        }
      ]
    };
  } else if (normalizedType.includes("living") || normalizedType.includes("dining")) {
    return {
      roomType: "Living Room",
      confidence: 95,
      overallSafetyScore: 75,
      subScores: {
        accessibility: 75,
        mobility: 70,
        fireSafety: 90,
        lighting: 70,
        organization: 80,
        fallPrevention: 65
      },
      detectedObjects: [
        { name: "Sofa / Couch", confidence: 99, boundingBox: { x: 10, y: 40, width: 45, height: 45 } },
        { name: "Coffee Table", confidence: 97, boundingBox: { x: 20, y: 55, width: 30, height: 20 } },
        { name: "Electrical Cords", confidence: 85, boundingBox: { x: 65, y: 75, width: 25, height: 15 } },
        { name: "Armchair", confidence: 94, boundingBox: { x: 65, y: 45, width: 25, height: 45 } }
      ],
      hazards: [
        {
          title: "Trailing electrical extension cords",
          category: "Trip Hazard",
          severity: "High",
          description: "Electrical cords are routed across or immediately adjacent to walkways, presenting an immediate snag/trip danger.",
          location: "Floor near wall outlets and seating",
          confidence: 90,
          objectsInvolved: ["Electrical Cords"],
          reasoning: "Loose, unsecured cables on the floor are easy to catch with slippers, walkers, or cane tips, frequently inducing sudden forward falls.",
          boundingBox: { x: 60, y: 70, width: 30, height: 20 }
        },
        {
          title: "Low seating with soft cushioning",
          category: "Unsafe Furniture",
          severity: "Medium",
          description: "The primary sofa has deep, low seating with plush cushioning and lacks rigid, high armrests to aid in sitting and standing transitions.",
          location: "Sofa seating area",
          confidence: 86,
          objectsInvolved: ["Sofa / Couch"],
          reasoning: "Soft, low couches trap body weight, forcing seniors to rock back and forth or use excess effort, increasing fall risk upon standing.",
          boundingBox: { x: 15, y: 45, width: 35, height: 35 }
        },
        {
          title: "Inadequately cleared walkway channels",
          category: "Blocked Exit",
          severity: "Medium",
          description: "The spacing between the coffee table, sofa, and side chairs is narrow, making navigating with a mobility device like a walker difficult.",
          location: "Central walkway clearance",
          confidence: 84,
          objectsInvolved: ["Coffee Table", "Sofa / Couch"],
          reasoning: "Safe navigation requires at least 32-36 inches of unobstructed width. Tight gaps lead to bumping into furniture and balance loss.",
          boundingBox: { x: 15, y: 50, width: 50, height: 35 }
        }
      ],
      recommendations: [
        {
          title: "Reroute and bundle electrical cords",
          description: "Relocate cords along the baseboards using adhesive wire channels/cord covers, or move appliances closer to wall outlets to clear all paths.",
          priority: "immediate",
          estimatedCost: { min: 8, max: 25 },
          expectedImpact: 18,
          whyDetected: "Exposed, loose trailing electrical wires crossing walk-spaces.",
          objectsInvolved: ["Electrical Cords"],
          certainty: 95,
          falsePositivePossible: false
        },
        {
          title: "Rearrange furniture to clear wider pathways",
          description: "Reposition the coffee table or replace it with end tables to create a continuous, unobstructed 36-inch wide channel for walkers/wheelchairs.",
          priority: "soon",
          estimatedCost: { min: 0, max: 0 },
          expectedImpact: 14,
          whyDetected: "Pathways around central coffee table are restricted and narrow.",
          objectsInvolved: ["Coffee Table", "Sofa / Couch"],
          certainty: 90,
          falsePositivePossible: false
        },
        {
          title: "Introduce a high-backed, supportive armchair",
          description: "Add a firm, high-seat armchair (seat height 19-21 inches) with sturdy wood or padded armrests that extend to the front edge to facilitate easy sitting/standing.",
          priority: "soon",
          estimatedCost: { min: 150, max: 400 },
          expectedImpact: 12,
          whyDetected: "Seating is low, soft, and lacks front-extending supportive armrests.",
          objectsInvolved: ["Armchair", "Sofa / Couch"],
          certainty: 87,
          falsePositivePossible: false
        }
      ]
    };
  } else if (normalizedType.includes("stair") || normalizedType.includes("hall") || normalizedType.includes("entry")) {
    return {
      roomType: "Staircase",
      confidence: 95,
      overallSafetyScore: 58,
      subScores: {
        accessibility: 40,
        mobility: 45,
        fireSafety: 90,
        lighting: 60,
        organization: 85,
        fallPrevention: 35
      },
      detectedObjects: [
        { name: "Stairs", confidence: 99, boundingBox: { x: 10, y: 10, width: 80, height: 80 } },
        { name: "Handrail", confidence: 96, boundingBox: { x: 15, y: 20, width: 5, height: 70 } }
      ],
      hazards: [
        {
          title: "Single-sided handrail installation",
          category: "Missing Safety Equipment",
          severity: "High",
          description: "The staircase only features a handrail on one side, leaving the other side open or unsupported, which is unsafe for bi-lateral grip needs.",
          location: "Staircase wall",
          confidence: 94,
          objectsInvolved: ["Stairs", "Handrail"],
          reasoning: "Continuous, dual-sided handrails are essential for stairs, enabling users to maintain three points of contact regardless of direction or single-sided weakness.",
          boundingBox: { x: 75, y: 15, width: 10, height: 75 }
        },
        {
          title: "Dim lighting over steps and landing",
          category: "Poor Lighting",
          severity: "High",
          description: "The illumination level along the stairway treads appears low, which hides step edges and landing transitions.",
          location: "Stair steps",
          confidence: 90,
          objectsInvolved: ["Stairs"],
          reasoning: "Stairs require bright, uniform lighting to ensure depth perception is accurate. Shadows on treads cause missteps and catastrophic falls.",
          boundingBox: { x: 20, y: 30, width: 60, height: 40 }
        }
      ],
      recommendations: [
        {
          title: "Install a second continuous handrail",
          description: "Mount a second, continuous matching handrail on the opposite wall of the staircase, ensuring it extends 12 inches beyond the top and bottom steps.",
          priority: "immediate",
          estimatedCost: { min: 120, max: 350 },
          expectedImpact: 25,
          whyDetected: "Identified a single handrail serving a main staircase.",
          objectsInvolved: ["Stairs", "Handrail"],
          certainty: 95,
          falsePositivePossible: false
        },
        {
          title: "Upgrade to dual-end three-way switches or motion LEDs",
          description: "Install bright LED bulbs (800+ lumens) and add motion-activated safety nightlights at the top, middle, and bottom landings.",
          priority: "immediate",
          estimatedCost: { min: 20, max: 75 },
          expectedImpact: 18,
          whyDetected: "Lighting along the stairwell is dim and unevenly distributed.",
          objectsInvolved: ["Stairs"],
          certainty: 92,
          falsePositivePossible: false
        }
      ]
    };
  } else {
    // General fallback
    return {
      roomType: roomType || "Living Room",
      confidence: 90,
      overallSafetyScore: 70,
      subScores: {
        accessibility: 65,
        mobility: 70,
        fireSafety: 85,
        lighting: 70,
        organization: 75,
        fallPrevention: 60
      },
      detectedObjects: [
        { name: "Furniture", confidence: 95, boundingBox: { x: 15, y: 40, width: 50, height: 45 } },
        { name: "Pathway", confidence: 90, boundingBox: { x: 30, y: 65, width: 40, height: 30 } },
        { name: "Rug", confidence: 88, boundingBox: { x: 20, y: 70, width: 50, height: 20 } }
      ],
      hazards: [
        {
          title: "Potential trip hazards in key pathways",
          category: "Trip Hazard",
          severity: "Medium",
          description: "Unsecured loose carpets or rugs might slide, creating curling edges directly in primary walking pathways.",
          location: "Central walkway floor",
          confidence: 85,
          objectsInvolved: ["Rug"],
          reasoning: "Loose, slippery rug textures lack strong floor adhesive, leading to sudden stumbles during high-traffic home movement.",
          boundingBox: { x: 25, y: 72, width: 45, height: 18 }
        },
        {
          title: "Inadequate localized task lighting",
          category: "Poor Lighting",
          severity: "Medium",
          description: "General light levels are insufficient for detailed tasks, reading, or navigating obstacles safely at night.",
          location: "Room corners and pathways",
          confidence: 82,
          objectsInvolved: ["Pathway"],
          reasoning: "Low light hinders hazard identification, making obstacles on the floor difficult to spot and avoid.",
          boundingBox: { x: 40, y: 10, width: 20, height: 20 }
        }
      ],
      recommendations: [
        {
          title: "Secure or anchor all loose flooring and rugs",
          description: "Use double-sided high-grip rug tape or anti-slip rubber pads under all mats and carpets to keep them completely flat and locked.",
          priority: "soon",
          estimatedCost: { min: 10, max: 25 },
          expectedImpact: 15,
          whyDetected: "Possibility of shifting throw rugs or unsecured carpets.",
          objectsInvolved: ["Rug"],
          certainty: 90,
          falsePositivePossible: true
        },
        {
          title: "Enhance room light with motion-sensor smart plug lights",
          description: "Install compact plug-in nightlights or replace standard bulbs with high-efficiency LEDs to reach at least 600 lumens.",
          priority: "soon",
          estimatedCost: { min: 15, max: 40 },
          expectedImpact: 12,
          whyDetected: "Dim sections observed in active walk areas.",
          objectsInvolved: ["Pathway"],
          certainty: 88,
          falsePositivePossible: false
        }
      ]
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON requests (images can be large)
  app.use(express.json({ limit: "50mb" }));

  // Temporary images map for Magic Hour image-to-image/editor
  const tempImages = new Map<string, { buffer: Buffer, mimeType: string }>();

  // Route to serve temp images to Magic Hour
  app.get("/api/temp-images/:id.jpg", (req, res) => {
    const { id } = req.params;
    const img = tempImages.get(id);
    if (!img) {
      return res.status(404).send("Image not found");
    }
    res.setHeader("Content-Type", img.mimeType);
    res.send(img.buffer);
  });

  // AI Route
  app.post("/api/analyze-room", async (req, res) => {
    try {
      const { imageBase64, imagesBase64, roomType } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const parts: any[] = [];
      const imagesToProcess = imagesBase64 && Array.isArray(imagesBase64) && imagesBase64.length > 0 
        ? imagesBase64 
        : [imageBase64];

      for (const imgBase64 of imagesToProcess) {
        let pureBase64 = imgBase64;
        let mimeType = "image/jpeg";

        if (imgBase64.startsWith("http")) {
          try {
            const imgRes = await fetch(imgBase64);
            if (!imgRes.ok) throw new Error(`HTTP error ${imgRes.status}`);
            const buffer = await imgRes.arrayBuffer();
            pureBase64 = Buffer.from(buffer).toString('base64');
            mimeType = imgRes.headers.get('content-type') || "image/jpeg";
          } catch (fetchErr) {
            console.error("Failed to fetch remote image:", fetchErr);
            continue; // Skip failed image instead of failing everything
          }
        } else if (imgBase64.startsWith("data:")) {
          const splitParts = imgBase64.split(",");
          pureBase64 = splitParts[1];
          mimeType = splitParts[0].split(":")[1].split(";")[0];
        }

        parts.push({
          inlineData: {
            mimeType,
            data: pureBase64,
          },
        });
      }

      const promptText = `The room type is ${roomType || 'unknown'}.\n\n${ROOM_ANALYSIS_PROMPT}\n\nIMPORTANT: You have been provided with multiple images. The FIRST image is the full room view. The subsequent images are zoomed-in quadrants of the same room to help you see more detail. ALL BOUNDING BOXES you return MUST be calculated relative to the FIRST (full) image.`;
      parts.push({ text: promptText });

      const response = await safeGenerateContent(ai, {
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roomType: { type: Type.STRING, description: "The type of room identified" },
              confidence: { type: Type.NUMBER, description: "Confidence score 0-100 for room identification" },
              overallSafetyScore: { type: Type.NUMBER, description: "Overall safety score 0-100" },
              subScores: {
                type: Type.OBJECT,
                properties: {
                  accessibility: { type: Type.NUMBER },
                  mobility: { type: Type.NUMBER },
                  fireSafety: { type: Type.NUMBER },
                  lighting: { type: Type.NUMBER },
                  organization: { type: Type.NUMBER },
                  fallPrevention: { type: Type.NUMBER }
                },
                required: ["accessibility", "mobility", "fireSafety", "lighting", "organization", "fallPrevention"]
              },
              detectedObjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      },
                      required: ["x", "y", "width", "height"]
                    }
                  },
                  required: ["name", "confidence", "boundingBox"]
                }
              },
              hazards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    severity: { type: Type.STRING, description: "Critical, High, Medium, or Low" },
                    description: { type: Type.STRING },
                    location: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    objectsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reasoning: { type: Type.STRING },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      },
                      required: ["x", "y", "width", "height"]
                    }
                  },
                  required: ["title", "category", "severity", "description", "location", "confidence", "objectsInvolved", "reasoning", "boundingBox"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, description: "immediate, soon, or future" },
                    estimatedCost: {
                      type: Type.OBJECT,
                      properties: {
                        min: { type: Type.NUMBER },
                        max: { type: Type.NUMBER }
                      },
                      required: ["min", "max"]
                    },
                    expectedImpact: { type: Type.NUMBER, description: "Impact score 0-100" },
                    whyDetected: { type: Type.STRING },
                    objectsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                    certainty: { type: Type.NUMBER },
                    falsePositivePossible: { type: Type.BOOLEAN }
                  },
                  required: ["title", "description", "priority", "estimatedCost", "expectedImpact", "whyDetected", "objectsInvolved", "certainty", "falsePositivePossible"]
                }
              }
            },
            required: ["roomType", "confidence", "overallSafetyScore", "subScores", "detectedObjects", "hazards", "recommendations"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.slice(7, -3);
        }
        const json = JSON.parse(jsonString);
        res.json(json);
      } else {
        throw new Error("No text response from Gemini");
      }
      
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(429).json({ 
        error: "API rate limit exceeded. The free tier allows 5 requests per minute. Please wait 60 seconds and try again." 
      });
    }
  });

  // AI Upgrade Visualization Route
  app.post("/api/visualize-upgrades", async (req, res) => {
    try {
      const { image, upgrades } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let pureBase64 = image;
      let mimeType = "image/jpeg";

      if (image.startsWith("http")) {
        const imgRes = await fetch(image);
        const buffer = await imgRes.arrayBuffer();
        pureBase64 = Buffer.from(buffer).toString('base64');
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      } else if (image.startsWith("data:")) {
        const parts = image.split(",");
        pureBase64 = parts[1];
        mimeType = parts[0].split(":")[1].split(";")[0];
      }

      // Agnes AI API configuration
      const agnesApiKey = process.env.AGNES_API_KEY || 'sk-0nnrqE1AhxNghlnE0dFYbXimUjxVHaghqeW2NMA8loXV1XU0';

      let generatedPrompt = `Transform the room to simultaneously install and clearly display ALL of the following safety and accessibility features: ${upgrades.join('; ')}. Every single one of these items must be separately, clearly, and visibly added to the room in their appropriate, logical locations. Keep the original room layout, flooring, walls, lighting, and major furniture identical. Photographic, realistic, 4k, interior design, high visual density, all safety features visible.`;

      try {
        console.log("Asking Gemini to generate a contextually-accurate prompt based on original image...");
        const promptText = `Analyze the room in the image and write a detailed, high-fidelity image-to-image prompt for an AI image editor (Agnes AI) that will render this transformation.
The prompt MUST describe how to transform the scene to professionally install, add, and clearly display ALL of the following elderly safety and accessibility upgrades simultaneously:
${upgrades.map((u, i) => `${i + 1}. ${u}`).join('\n')}

CRITICAL INSTRUCTIONS FOR THE PROMPT YOU GENERATE:
1. EXHAUSTIVE COVERAGE: Your generated prompt MUST describe the physical appearance, exact materials, and precise logical placement of EVERY SINGLE ONE of the requested upgrades listed above. Do NOT omit, neglect, or summarize any of them. Each item must be described in its own separate, highly specific detail.
2. SIMULTANEOUS VISIBILITY: Specify in your prompt that all of these upgrades are present at the same time in the same room. For example, if there are grab bars AND a non-slip mat AND motion-sensor lighting, describe where the grab bars are mounted on the wall, where the non-slip mat is placed on the floor, and where the motion-sensor lighting is installed to illuminate the space.
3. PRESERVE COMPOSITION: Clearly state that the original room layout, walls, flooring, major furniture, camera angle, perspective, and general structure must remain identical to the original image—only these new safety additions are introduced.
4. FORMAT: The response must be a single cohesive, highly detailed, text-dense paragraph focusing strictly on realistic visual and spatial details.
5. TERMINATION: End the generated prompt exactly with: "photographic, realistic, 4k, interior design, high visual density, all safety features visible".
6. RAW TEXT ONLY: Do not output any conversational wrapper, quotes, introductions, or bullet points. Just return the raw paragraph to be sent directly to the image model.`;

        const promptImagePart = {
          inlineData: {
            mimeType,
            data: pureBase64,
          },
        };

        const geminiRes = await safeGenerateContent(ai, {
          contents: { parts: [promptImagePart, { text: promptText }] }
        });

        if (geminiRes.text) {
          generatedPrompt = geminiRes.text.trim();
          console.log("Gemini generated detailed prompt for Agnes:", generatedPrompt);
        }
      } catch (geminiPromptErr: any) {
        console.warn("Gemini prompt enhancement failed, using default prompt:", geminiPromptErr.message || geminiPromptErr);
      }

      const dataUri = `data:${mimeType};base64,${pureBase64}`;

      console.log("Sending image-to-image request to Agnes AI...");
      const payload = {
        model: "agnes-image-2.1-flash",
        prompt: generatedPrompt,
        size: "1024x768",
        extra_body: {
          image: [dataUri],
          response_format: "url"
        }
      };

      const agnesRes = await fetch("https://apihub.agnes-ai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${agnesApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const agnesData = await agnesRes.json();

      if (agnesRes.ok && agnesData.data && agnesData.data.length > 0 && agnesData.data[0].url) {
        const generatedImageUrl = agnesData.data[0].url;
        console.log("Agnes AI image-to-image generation successful:", generatedImageUrl);
        res.json({ success: true, image: generatedImageUrl });
      } else {
        const errMsg = agnesData?.error?.message || "Failed to generate image via Agnes AI";
        console.error("Agnes AI failed:", agnesData);
        res.json({
          success: false,
          error: "ai_generation_unavailable",
          errors: [errMsg]
        });
      }

    } catch (error: any) {
      console.error("Error generating safety visualization:", error);
      res.status(500).json({ error: error.message || "Failed to generate safety visualization using AI" });
    }
  });

  // Yelp Search API proxy to handle CORS and protect the key
  app.get("/api/yelp-search", async (req, res) => {
    try {
      const { latitude, longitude, term, categories, radius } = req.query;
      
      const apiKey = process.env.YELP_API_KEY || "GD9xhB8AlwiF5FcC94vA2dZHbXKISQzM8CHWOoVLgwlxfopGW-l8HNF-L2NfR_fWx1ot8WODapfGItSeW-cp2OvxxB50BvyxcPMAO0e1cZw2yOfpWhx9OrlKFt9TanYx";

      if (!apiKey) {
        return res.status(400).json({ error: "Yelp API key is missing. Please set YELP_API_KEY." });
      }

      const yelpUrl = new URL("https://api.yelp.com/v3/businesses/search");
      if (latitude) yelpUrl.searchParams.append("latitude", latitude as string);
      if (longitude) yelpUrl.searchParams.append("longitude", longitude as string);
      if (term) yelpUrl.searchParams.append("term", term as string);
      if (categories) yelpUrl.searchParams.append("categories", categories as string);
      if (radius) {
        // Convert miles to meters. Yelp radius is in meters, max 40000 (~25 miles)
        const meters = Math.min(40000, Math.round(parseFloat(radius as string) * 1609.34));
        yelpUrl.searchParams.append("radius", meters.toString());
      } else {
        yelpUrl.searchParams.append("radius", "24140"); // Default 15 miles in meters
      }
      yelpUrl.searchParams.append("limit", "25");

      console.log(`Proxying search to Yelp API: ${yelpUrl.toString()}`);

      const response = await fetch(yelpUrl.toString(), {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Yelp API error response details:", errorData);
        return res.status(response.status).json({
          error: "Yelp API request failed",
          details: errorData
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Yelp Proxy Server Error:", error);
      res.status(500).json({ error: "Internal server error fetching Yelp results", message: error.message });
    }
  });

  // Helper for rule-based classification fallback
  function getRuleBasedClassification(title: string): string {
    const titleLower = (title || "").toLowerCase();
    if (
      titleLower.includes("grab bar") || 
      titleLower.includes("shower") || 
      titleLower.includes("tub") || 
      titleLower.includes("bathroom")
    ) {
      return "Bathroom";
    } else if (
      titleLower.includes("light") || 
      titleLower.includes("illumination") || 
      titleLower.includes("lamp") ||
      titleLower.includes("switch") ||
      titleLower.includes("outlet")
    ) {
      return "Electrical";
    } else if (
      titleLower.includes("mat") || 
      titleLower.includes("floor") || 
      titleLower.includes("rug") ||
      titleLower.includes("slip") ||
      titleLower.includes("trip") ||
      titleLower.includes("carpet")
    ) {
      return "Flooring";
    } else if (
      titleLower.includes("ramp") || 
      titleLower.includes("wheelchair") || 
      titleLower.includes("step") ||
      titleLower.includes("access") ||
      titleLower.includes("ada")
    ) {
      return "Accessibility";
    } else if (titleLower.includes("plumb") || titleLower.includes("toilet") || titleLower.includes("leak") || titleLower.includes("sink")) {
      return "Plumbing";
    } else if (titleLower.includes("cabinet") || titleLower.includes("shelf") || titleLower.includes("shelves")) {
      return "Cabinets";
    } else if (titleLower.includes("stove") || titleLower.includes("cooktop") || titleLower.includes("kitchen")) {
      return "Kitchen";
    } else if (titleLower.includes("paint") || titleLower.includes("coating")) {
      return "Painting";
    } else if (titleLower.includes("stair") || titleLower.includes("handrail") || titleLower.includes("rail") || titleLower.includes("mount")) {
      return "Handyman";
    } else if (titleLower.includes("hvac") || titleLower.includes("heat") || titleLower.includes("air") || titleLower.includes("filter")) {
      return "HVAC";
    } else if (titleLower.includes("roof") || titleLower.includes("shingle")) {
      return "Roofing";
    } else if (titleLower.includes("medical") || titleLower.includes("walker") || titleLower.includes("wheelchair")) {
      return "Medical Equipment";
    } else if (titleLower.includes("bracket") || titleLower.includes("hardware") || titleLower.includes("screw") || titleLower.includes("fasten")) {
      return "Hardware";
    }
    return "Handyman"; // Default fallback
  }

  // AI Suggestion Classification Route
  app.post("/api/classify-suggestion", async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ error: "No suggestion title provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        const category = getRuleBasedClassification(title);
        return res.json({ category, suggestedQuery: title });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const allowedCategories = [
        "ADA", "Plumbing", "Electrical", "HVAC", "Flooring", 
        "Roofing", "Cabinets", "Kitchen", "Bathroom", "Hardware", 
        "Medical Equipment", "Accessibility", "Painting", "Handyman"
      ];

      const promptText = `Classify this elderly home safety recommendation into exactly one of these 14 available categories:
${allowedCategories.join(", ")}

Recommendation Details:
Title: ${title}
Description: ${description || ''}

Return a JSON object containing:
1. "category": The selected category name. It MUST be EXACTLY one of the 14 listed above. If it fits multiple, select the single best fitting category.
2. "suggestedQuery": A simplified 1-2 word query representing the primary safety hardware/service mentioned (e.g. "grab bars", "led lighting", "non-slip flooring", "ramp") which can be used to search Yelp or product marketplaces.`;

      const response = await safeGenerateContent(ai, {
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { 
                type: Type.STRING, 
                description: "Must be exactly one of the 14 allowed categories." 
              },
              suggestedQuery: { 
                type: Type.STRING, 
                description: "Short 1-2 word search keyword for the item." 
              }
            },
            required: ["category", "suggestedQuery"]
          }
        }
      });

      if (response.text) {
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.slice(7, -3);
        }
        const data = JSON.parse(jsonStr);
        let category = data.category;
        if (!allowedCategories.includes(category)) {
          category = getRuleBasedClassification(title);
        }
        return res.json({ category, suggestedQuery: data.suggestedQuery || title });
      } else {
        throw new Error("Empty response from Gemini");
      }

    } catch (error) {
      console.warn("AI Classification failed or quota exceeded. Using rule-based fallback.", error);
      const { title } = req.body;
      const category = getRuleBasedClassification(title);
      res.json({ category, suggestedQuery: title });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Helper to convert raw PCM samples into a standard WAV buffer for Gemini API
  function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
    const header = Buffer.alloc(44);
    const dataSize = pcmBuffer.length;
    const fileSize = dataSize + 36;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  // Setup WebSocket server for Gemini Live API
  const wss = new WebSocketServer({ server });
  
  wss.on("connection", async (clientWs, request) => {
    if (request.url !== '/api/live-walkthrough') return;
    
    if (!process.env.GEMINI_API_KEY) {
      clientWs.close(1011, "No Gemini API Key");
      return;
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Buffers & timers to transcribe AI and user audio into verbatim text transcripts
    let aiPcmChunks: Buffer[] = [];
    let aiTranscriptionTimer: NodeJS.Timeout | null = null;
    let userPcmChunks: Buffer[] = [];
    let userTranscriptionTimer: NodeJS.Timeout | null = null;

    const flushAiTranscription = async () => {
      if (aiPcmChunks.length === 0) return;
      const combinedPcm = Buffer.concat(aiPcmChunks);
      aiPcmChunks = [];
      if (combinedPcm.length < 24000 * 2 * 0.15) return; // Ignore under 0.15s

      try {
        const wavBuf = pcmToWavBuffer(combinedPcm, 24000);
        const wavBase64 = wavBuf.toString("base64");
        const transcriptText = await safeTranscribeAudio(
          ai,
          wavBase64,
          "Transcribe this spoken audio verbatim in clear English. Output ONLY the spoken transcript text with no extra commentary or quotes."
        );
        if (transcriptText && clientWs.readyState === clientWs.OPEN) {
          clientWs.send(JSON.stringify({ text: transcriptText }));
        }
      } catch (err) {
        console.error("AI audio transcription error:", err);
      }
    };

    const handleAiAudioChunk = (base64Data: string) => {
      aiPcmChunks.push(Buffer.from(base64Data, 'base64'));
      if (aiTranscriptionTimer) clearTimeout(aiTranscriptionTimer);
      aiTranscriptionTimer = setTimeout(flushAiTranscription, 800);
    };
    
    try {
      let session: any;
      try {
        session = await ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
            },
            systemInstruction: "You are CareLens, an empathetic and highly observant Occupational Therapist. The user is walking around their home showing you the environment through their camera. Guide them gently, ask them to pan or look closer if needed, and point out potential safety hazards for elderly individuals (e.g., loose rugs, raised thresholds, poor lighting, lack of grab bars). Keep your responses concise (1-2 sentences) and supportive.",
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts) {
                for (const p of parts) {
                  if (p.inlineData?.data) {
                    clientWs.send(JSON.stringify({ audio: p.inlineData.data }));
                    handleAiAudioChunk(p.inlineData.data);
                  }
                  if (p.text) {
                    clientWs.send(JSON.stringify({ text: p.text }));
                  }
                }
              }

              if (message.serverContent?.turnComplete) {
                if (aiTranscriptionTimer) clearTimeout(aiTranscriptionTimer);
                flushAiTranscription();
              }

              if (message.serverContent?.interrupted) {
                if (aiTranscriptionTimer) clearTimeout(aiTranscriptionTimer);
                aiPcmChunks = [];
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            },
            onclose: (e: any) => {
              console.log("Gemini Live API session closed:", e?.code, e?.reason);
              if (clientWs.readyState === clientWs.OPEN) {
                clientWs.close(1000, e?.reason || "Live session finished");
              }
            },
            onerror: (err: any) => {
              console.error("Live API Error:", err);
            }
          },
        });
      } catch (primaryErr) {
        console.warn("Primary live model failed, trying fallback gemini-2.5-flash-native-audio-latest...", primaryErr);
        session = await ai.live.connect({
          model: "gemini-2.5-flash-native-audio-latest",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
            },
            systemInstruction: "You are CareLens, an empathetic and highly observant Occupational Therapist. The user is walking around their home showing you the environment through their camera. Guide them gently, ask them to pan or look closer if needed, and point out potential safety hazards for elderly individuals (e.g., loose rugs, raised thresholds, poor lighting, lack of grab bars). Keep your responses concise (1-2 sentences) and supportive.",
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts) {
                for (const p of parts) {
                  if (p.inlineData?.data) {
                    clientWs.send(JSON.stringify({ audio: p.inlineData.data }));
                    handleAiAudioChunk(p.inlineData.data);
                  }
                  if (p.text) {
                    clientWs.send(JSON.stringify({ text: p.text }));
                  }
                }
              }

              if (message.serverContent?.turnComplete) {
                if (aiTranscriptionTimer) clearTimeout(aiTranscriptionTimer);
                flushAiTranscription();
              }

              if (message.serverContent?.interrupted) {
                if (aiTranscriptionTimer) clearTimeout(aiTranscriptionTimer);
                aiPcmChunks = [];
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            },
            onclose: (e: any) => {
              console.log("Gemini Live API fallback session closed:", e?.code, e?.reason);
              if (clientWs.readyState === clientWs.OPEN) {
                clientWs.close(1000, e?.reason || "Live session finished");
              }
            },
            onerror: (err: any) => {
              console.error("Live API Fallback Error:", err);
            }
          },
        });
      }

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });

            // Accumulate user microphone audio for transcript log
            userPcmChunks.push(Buffer.from(parsed.audio, 'base64'));
            if (userTranscriptionTimer) clearTimeout(userTranscriptionTimer);
            userTranscriptionTimer = setTimeout(async () => {
              if (userPcmChunks.length === 0) return;
              const combinedUserPcm = Buffer.concat(userPcmChunks);
              userPcmChunks = [];
              if (combinedUserPcm.length < 16000 * 2 * 0.25) return;
              try {
                const wavBuf = pcmToWavBuffer(combinedUserPcm, 16000);
                const wavBase64 = wavBuf.toString("base64");
                const userTranscriptText = await safeTranscribeAudio(
                  ai,
                  wavBase64,
                  "Transcribe this user speech verbatim in English. Output ONLY the exact transcript text with no extra commentary or quotes."
                );
                if (userTranscriptText && clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ text: userTranscriptText, isUser: true }));
                }
              } catch (e) {
                console.error("User audio transcription error:", e);
              }
            }, 800);
          }

          if (parsed.text) {
            // Send echo back to client for transcript/UI acknowledgement
            clientWs.send(JSON.stringify({ text: parsed.text, isUser: true }));
            
            try {
              session.sendRealtimeInput({ text: parsed.text });
            } catch (err) {
              console.warn("sendRealtimeInput text failed, using sendClientContent fallback", err);
              session.sendClientContent({ turns: [{ role: "user", parts: [{ text: parsed.text }] }], turnComplete: true });
            }
          }
          if (parsed.video) {
            session.sendRealtimeInput({
              video: { data: parsed.video, mimeType: "image/jpeg" }
            });
          }
        } catch (err) {
          console.error("Error parsing message from client", err);
        }
      });
      
      clientWs.on("close", () => {
        // cleanup session if needed
        try {
          session.close();
        } catch(e) {}
      });
      
    } catch (err) {
      console.error("Failed to start Live API session", err);
      clientWs.close(1011, "Failed to start Live API");
    }
  });
}

startServer();
