import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const session = await ai.live.connect({
        model: "gemini-2.0-flash-exp",
    });
    console.log("Connected");
    session.sendRealtimeInput([
      { mimeType: "image/jpeg", data: "base64data" }
    ]);
    console.log("Sent");
    setTimeout(() => session.close(), 1000);
  } catch (e) {
    console.error("Failed:", e);
  }
}
test();
