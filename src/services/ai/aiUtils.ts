import { GoogleGenAI } from "@google/genai";

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ModelAttemptEvent {
  model: string;
  attempt: number;
  outcome: 'success' | 'retryable_failure' | 'model_failure';
  httpStatus?: number;
  errorCode?: string;
}

function getSafeErrorCode(error: any): string {
  const status = Number(error?.status);
  if (Number.isInteger(status) && status >= 400 && status <= 599) {
    return `http_${status}`;
  }
  if (typeof error?.code === 'string' && /^[A-Z0-9_]{1,40}$/i.test(error.code)) {
    return error.code.toLowerCase();
  }
  return 'provider_error';
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  modelName: string = "unknown",
  onAttempt?: (event: ModelAttemptEvent) => void
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      onAttempt?.({ model: modelName, attempt, outcome: 'success' });
      return result;
    } catch (err: any) {
      lastError = err;
      const isRetryable = 
        err?.status === 429 || 
        err?.status >= 500 || 
        err?.message?.toLowerCase().includes("quota") ||
        err?.message?.toLowerCase().includes("internal");
      const outcome = isRetryable && attempt < maxRetries ? 'retryable_failure' : 'model_failure';
      const httpStatus = Number(err?.status);
      onAttempt?.({
        model: modelName,
        attempt,
        outcome,
        ...(Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? { httpStatus } : {}),
        errorCode: getSafeErrorCode(err),
      });

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`[AI Retry] Attempt ${attempt} failed for ${modelName} (${getSafeErrorCode(err)}). Retrying in ${Math.round(delay)}ms.`);
      await sleep(delay);
    }
  }
  throw lastError;
}

export async function safeGenerateContent(
  ai: GoogleGenAI,
  params: any,
  options: { onAttempt?: (event: ModelAttemptEvent) => void } = {}
) {
  const modelsToTry = [
    "google/gemma-4-31B-it",
    "gemma-4-26b-a4b-it",
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
        modelName,
        options.onAttempt
      );
    } catch (err: any) {
      console.error(`[AI Failure] Model ${modelName} failed after retries (${getSafeErrorCode(err)}).`);
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
