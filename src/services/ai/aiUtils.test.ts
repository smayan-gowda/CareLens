import { describe, it, expect, vi, beforeEach } from "vitest";
import { retryWithBackoff, safeGenerateContent } from "./aiUtils";

describe("AI Utilities", () => {
  describe("retryWithBackoff", () => {
    it("should succeed on first try", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      const result = await retryWithBackoff(operation, 3, 10, "test-model");
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on transient errors and eventually succeed", async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ status: 500, message: "Internal Error" })
        .mockRejectedValueOnce({ status: 429, message: "Quota Exceeded" })
        .mockResolvedValue("success");
      
      const result = await retryWithBackoff(operation, 3, 10, "test-model");
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);
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

    it("should succeed with primary model (google/gemma-4-31B-it)", async () => {
      mockAi.models.generateContent.mockResolvedValue("primary-success");
      const result = await safeGenerateContent(mockAi, { contents: [] });
      expect(result).toBe("primary-success");
      expect(mockAi.models.generateContent).toHaveBeenCalledWith(expect.objectContaining({ model: "google/gemma-4-31B-it" }));
    });

    it("should fall back to Gemini if the Gemma model fails", async () => {
      mockAi.models.generateContent.mockImplementation(({ model }: { model: string }) => {
        if (model === "google/gemma-4-31B-it") {
          return Promise.reject({ status: 500, message: "Gemma 4 Failed" });
        }
        return Promise.resolve("fallback-success");
      });

      const result = await safeGenerateContent(mockAi, { contents: [] });
      expect(result).toBe("fallback-success");
      expect(mockAi.models.generateContent).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.8-flash" }));
    });

    it("should fail if all models fail", async () => {
      mockAi.models.generateContent.mockRejectedValue({ status: 500, message: "All Failed" });
      await expect(safeGenerateContent(mockAi, { contents: [] }))
        .rejects.toMatchObject({ status: 500 });
    }, 15000);
  });
});
