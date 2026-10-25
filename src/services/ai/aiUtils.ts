import { GoogleGenAI } from "@google/genai";

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  modelName: string = "unknown"
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const isRetryable = 
        err?.status === 429 || 
        err?.status >= 500 || 
        err?.message?.toLowerCase().includes("quota") ||
        err?.message?.toLowerCase().includes("internal");

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`[AI Retry] Attempt ${attempt} failed for ${modelName}. Retrying in ${Math.round(delay)}ms... Error:`, err?.message || err);
      await sleep(delay);
    }
  }
  throw lastError;
}

export async function safeGenerateContent(ai: GoogleGenAI, params: any) {
  const modelsToTry = [
    "google/gemma-4-31B-it",
    "gemini-3.8-flash"
  ];

  let lastError: any = null;
  const payloadSize = JSON.stringify(params).length;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI Attempt] Trying ${modelName} (Payload: ${Math.round(payloadSize / 1024)}KB)`);
      return await retryWithBackoff(
        () => ai.models.generateContent({ ...params, model: modelName }),
        3,
        1000,
        modelName
      );
    } catch (err: any) {
      console.error(`[AI Failure] Model ${modelName} failed after retries:`, {
        status: err?.status,
        message: err?.message,
        model: modelName
      });
      lastError = err;
    }
  }
  throw lastError;
}

export async function safeTranscribeAudio(ai: GoogleGenAI, wavBase64: string, promptText: string): Promise<string> {
  const audioModels = [
    "gemini-3.5-transcribe"
  ];

  for (const modelName of audioModels) {
    try {
      const res = await retryWithBackoff(
        () => ai.models.generateContent({
          model: modelName,
          contents: [
            { inlineData: { mimeType: "audio/wav", data: wavBase64 } },
            { text: promptText }
          ]
        }),
        3,
        1000,
        modelName
      );
      const text = res.text?.trim();
      if (text && !text.toLowerCase().includes("[silence]") && !text.toLowerCase().includes("[no speech]")) {
        return text;
      }
    } catch (err: any) {
      console.warn(`[Audio Transcribe] Model ${modelName} failed after retries:`, err?.message || err);
    }
  }
  return "";
}
