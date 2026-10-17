const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const pureBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [{ inlineData: { mimeType: "image/png", data: pureBase64 } }, { text: "Analyze this room" }] },
    });
    console.log(response.text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
