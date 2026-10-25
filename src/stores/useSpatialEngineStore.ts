import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SpatialEngineState {
  depthViewMode: "off" | "depth_only" | "depth_overlay";
  cachedDepthMaps: Record<string, string>;
  isDepthLoading: boolean;
  activeDepthEngine: string;
  depthNotice: string | null;

  setDepthViewMode: (mode: "off" | "depth_only" | "depth_overlay") => void;
  fetchDepthMap: (imageSource: string) => Promise<string | null>;
  clearCache: () => void;
}

export const useSpatialEngineStore = create<SpatialEngineState>()(
  persist(
    (set, get) => ({
      depthViewMode: "off",
      cachedDepthMaps: {},
      isDepthLoading: false,
      activeDepthEngine: "Default Perspective Sensor",
      depthNotice: null,

      setDepthViewMode: (mode) => set({ depthViewMode: mode }),

      fetchDepthMap: async (imageSource: string) => {
        if (!imageSource) return null;

        const cache = get().cachedDepthMaps;
        if (cache[imageSource]) {
          return cache[imageSource];
        }

        set({ isDepthLoading: true, depthNotice: null });

        try {
          const res = await fetch("/api/estimate-depth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageBase64: imageSource }),
          });

          if (!res.ok) {
            throw new Error("Failed to compute depth map.");
          }

          const data = await res.json();
          if (data.depthMapUrl) {
            set((state) => ({
              cachedDepthMaps: { ...state.cachedDepthMaps, [imageSource]: data.depthMapUrl },
              isDepthLoading: false,
              activeDepthEngine: data.engine || "Depth Anything V2",
              depthNotice: null,
            }));
            return data.depthMapUrl;
          }

          set({
            isDepthLoading: false,
            activeDepthEngine: data.engine || "Perspective Depth Sensor",
            depthNotice: data.message || null,
          });
          return null;
        } catch (err: any) {
          console.warn("[Spatial Engine Store] Depth estimation fallback:", err?.message || err);
          set({
            isDepthLoading: false,
            activeDepthEngine: "Perspective Depth Sensor",
            depthNotice: "Perspective spatial estimation active.",
          });
          return null;
        }
      },

      clearCache: () => set({ cachedDepthMaps: {} }),
    }),
    {
      name: "carelens-spatial-engine-storage",
      partialize: (state) => ({
        depthViewMode: state.depthViewMode,
      }),
    }
  )
);
