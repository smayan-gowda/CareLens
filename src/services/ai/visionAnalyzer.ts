import { SafetyAnalysis } from "./schemas";

export async function analyzeRoomImage(imageBase64: string, roomType?: string): Promise<SafetyAnalysis> {
  const response = await fetch("/api/analyze-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageBase64,
      roomType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze room image");
  }

  const data: SafetyAnalysis = await response.json();
  return data;
}
