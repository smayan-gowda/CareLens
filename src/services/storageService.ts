/**
 * Mock Storage Service
 * Abstracted to easily swap out for Firebase Storage in Stage 3.
 */

export interface StorageMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export const storageService = {
  /**
   * Simulates uploading a file to cloud storage
   * @param path The storage path (e.g., 'homes/homeId/rooms/roomId/images')
   * @param file The File object to upload
   * @param onProgress Callback for upload progress
   * @returns A promise that resolves to the download URL
   */
  async uploadImage(
    path: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 10; // Random progress chunks
        
        if (progress >= 100) {
          progress = 100;
          if (onProgress) onProgress(progress);
          clearInterval(interval);
          
          // Generate a local object URL to simulate cloud storage URL
          const url = URL.createObjectURL(file);
          resolve(url);
        } else {
          if (onProgress) onProgress(progress);
        }
      }, 300); // Update every 300ms
    });
  },

  /**
   * Simulates deleting a file from cloud storage
   * @param path The storage path or URL to delete
   */
  async deleteImage(path: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, we'd revoke object URLs or delete from cloud
        resolve();
      }, 500);
    });
  },

  /**
   * Retrieves images from a specific storage path
   * @param path The storage directory path
   */
  async getImages(path: string): Promise<string[]> {
    // Simulated mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 500);
    });
  },

  /**
   * Updates metadata for a stored file
   */
  async updateMetadata(path: string, metadata: Partial<StorageMetadata>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 300);
    });
  }
};
