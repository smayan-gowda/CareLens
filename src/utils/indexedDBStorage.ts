/**
 * IndexedDB High-Resolution Photo Storage
 * Allows storing full-resolution (4K/8K, 10MB+) image files/blobs directly in browser storage
 * without hitting Firestore or LocalStorage 1MB document limits.
 */

const DB_NAME = 'CareLensHighResPhotos';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const indexedDBStorage = {
  /**
   * Save a high-res image data URL or Blob into IndexedDB
   */
  async savePhoto(id: string, dataUrlOrBlob: string | Blob): Promise<string> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(dataUrlOrBlob, id);

        req.onsuccess = () => resolve(id);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB save failed, falling back:', err);
      return id;
    }
  },

  /**
   * Retrieve a high-res photo from IndexedDB as a Blob Object URL or base64 string
   */
  async getPhoto(id: string): Promise<string | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const result = req.result;
          if (!result) return resolve(null);

          if (result instanceof Blob) {
            resolve(URL.createObjectURL(result));
          } else if (typeof result === 'string') {
            resolve(result);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB retrieve failed:', err);
      return null;
    }
  },

  /**
   * Remove a stored high-res photo
   */
  async deletePhoto(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB delete failed:', err);
    }
  }
};
