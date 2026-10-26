import { describe, it, expect, vi, beforeEach } from "vitest";
import { retryWithBackoff, safeGenerateContent } from "./aiUtils";

describe("AI Utilities", () => {
  describe("retryWithBackoff", () => {
    it("should succeed on first try", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      const onAttempt = vi.fn();
      const result = await retryWithBackoff(operation, 3, 10, "test-model", onAttempt);
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onAttempt).toHaveBeenCalledWith({
        model: "test-model",
        attempt: 1,
        outcome: "success",
      });
    });

    it("should retry on transient errors and eventually succeed", async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ status: 500, message: "Internal Error" })
        .mockRejectedValueOnce({ status: 429, message: "Quota Exceeded" })
        .mockResolvedValue("success");
      const onAttempt = vi.fn();
      
      const result = await retryWithBackoff(operation, 3, 10, "test-model", onAttempt);
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
      expect(onAttempt.mock.calls.map(([event]) => event.outcome)).toEqual([
        "retryable_failure",
        "retryable_failure",
        "success",
      ]);
      expect(JSON.stringify(onAttempt.mock.calls)).not.toContain("Internal Error");
    });

    it("should fail after max retries", async () => {
      const operation = vi.fn().mockRejectedValue({ status: 500, message: "Internal Error" });
      await expect(retryWithBackoff(operation, 2, 10, "test-model"))
        .rejects.toMatchObject({ status: 500 });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors (e.g., 400)", async () => {
      const operation = vi.fn().mockRejectedValue({ status: 400, message: "Bad Request" });
      await expect(retryWithBackoff(operation, 3, 10, "test-model"))
        .rejects.toMatchObject({ status: 400 });
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("safeGenerateContent", () => {
    let mockAi: any;

    beforeEach(() => {
      mockAi = {
        models: {
          generateContent: vi.fn()
        }
      };
    });

    it("should use Gemma 4 31B as the primary model", async () => {
      mockAi.models.generateContent.mockResolvedValue("primary-success");
      const result = await safeGenerateContent(mockAi, { contents: [] });
      expect(result).toBe("primary-success");
      expect(mockAi.models.generateContent).toHaveBeenCalledWith(expect.objectContaining({ model: "gemma-4-31b-it" }));
    });

    it("should fall back to Gemma 4 26B when Gemma 4 31B is unavailable", async () => {
      mockAi.models.generateContent.mockImplementation(({ model }: { model: string }) => {
        if (model === "gemma-4-31b-it") {
          return Promise.reject({ status: 400, message: "Gemma 4 31B unavailable" });
        }
        return Promise.resolve("gemma-26b-success");
      });

      const result = await safeGenerateContent(mockAi, { contents: [] });
      expect(result).toBe("gemma-26b-success");
      expect(mockAi.models.generateContent.mock.calls.map(([params]) => params.model)).toEqual([
        "gemma-4-31b-it",
        "gemma-4-26b-a4b-it",
      ]);
    });

    it("should record model fallback attempts without provider messages", async () => {
      mockAi.models.generateContent.mockImplementation(({ model }: { model: string }) => {
        if (model === "gemma-4-31b-it") {
          return Promise.reject({ status: 400, message: "Private provider response" });
        }
        return Promise.resolve("fallback-success");
      });
      const onAttempt = vi.fn();

      await safeGenerateContent(mockAi, { contents: [] }, { onAttempt });

      expect(onAttempt.mock.calls.map(([event]) => ({
        model: event.model,
        outcome: event.outcome,
        errorCode: event.errorCode,
      }))).toEqual([
        { model: "gemma-4-31b-it", outcome: "model_failure", errorCode: "http_400" },
        { model: "gemma-4-26b-a4b-it", outcome: "success", errorCode: undefined },
      ]);
      expect(JSON.stringify(onAttempt.mock.calls)).not.toContain("Private provider response");
    });

    it("should fall back through both Gemma models and Gemini models", async () => {
      mockAi.models.generateContent.mockImplementation(({ model }: { model: string }) => {
        if (model !== "gemini-2.5-flash") {
          return Promise.reject({ status: 400, message: "Model unavailable" });
        }
        return Promise.resolve("gemini-25-success");
      });

      const result = await safeGenerateContent(mockAi, { contents: [] });
      expect(result).toBe("gemini-25-success");
      expect(mockAi.models.generateContent.mock.calls.map(([params]) => params.model)).toEqual([
        "gemma-4-31b-it",
        "gemma-4-26b-a4b-it",
        "gemini-3.6-flash",
        "gemini-3.8-flash",
        "gemini-2.5-flash",
      ]);
    });

    it("should fail if all models fail", async () => {
      mockAi.models.generateContent.mockRejectedValue({ status: 400, message: "All Failed" });
      await expect(safeGenerateContent(mockAi, { contents: [] }))
        .rejects.toMatchObject({ status: 400 });
    });
  });
});
