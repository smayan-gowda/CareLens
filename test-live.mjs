import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
console.log("Connecting...");
ai.live.connect({
    model: "gemini-2.0-flash-exp",
    config: { responseModalities: [Modality.AUDIO] },
    callbacks: {
        onmessage: (m) => console.log("msg", JSON.stringify(m)),
        onclose: () => { console.log("Session closed!"); process.exit(1); },
        onerror: (e) => { console.log("Session error!", e); process.exit(1); }
    }
}).then(session => {
  console.log("Connected");
  
  session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello" }] }], turnComplete: true });
  console.log("Sent clientContent text");
  
  setTimeout(() => {
    session.close();
    process.exit(0);
  }, 2000);
}).catch(e => {
  console.error("Error", e);
  process.exit(1);
});
