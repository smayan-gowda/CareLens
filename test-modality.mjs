import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
console.log("Connecting...");
ai.live.connect({
    model: "gemini-2.0-flash-exp",
    config: { responseModalities: [Modality.AUDIO] },
    callbacks: {
        onmessage: (m) => {
            if (m.serverContent?.modelTurn) {
               const parts = m.serverContent.modelTurn.parts;
               if (parts) {
                   for (const p of parts) {
                       if (p.text) process.stdout.write(p.text);
                   }
               }
            } else {
               console.log("Other msg:", Object.keys(m));
            }
        },
        onclose: () => { console.log("Closed"); process.exit(0); },
        onerror: (e) => { console.log("Error:", e); process.exit(1); },
    }
}).then(session => {
  console.log("Connected");
  session.send({ clientContent: { turns: [ { role: "user", parts: [ { text: "Hello" } ] } ], turnComplete: true } });
  setTimeout(() => session.close(), 5000);
});
