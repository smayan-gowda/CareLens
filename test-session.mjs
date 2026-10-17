import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
console.log("Connecting...");
ai.live.connect({
    model: "gemini-2.0-flash-exp",
    config: { responseModalities: [Modality.AUDIO] },
    callbacks: {
        onmessage: (m) => console.log("msg", Object.keys(m))
    }
}).then(session => {
  console.log("Connected");
  session.send({ clientContent: { turns: [{ role: "user", parts: [{ text: "Hello" }] }], turnComplete: true } });
  setTimeout(() => session.close(), 1000);
}).catch(e => console.error(e));
