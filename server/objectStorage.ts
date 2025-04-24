// Object storage interface for handling file uploads and downloads
// This implementation provides a set of methods for handling file storage

/**
 * Interface for object storage operations
 */
export interface IObjectStorage {
  upload: (file: any, path: string) => Promise<{path: string}>;
  download: (path: string) => Promise<any>;
  getPublicUrl: (path: string) => string;
  delete: (path: string) => Promise<boolean>;
}

/**
 * Implementation of object storage using mock data for development
 */
export const objectStorage: IObjectStorage = {
  upload: async (file: any, path: string) => {
    console.log(`[ObjectStorage] Upload: ${path}`);
    return { path };
  },
  
  download: async (path: string) => {
    console.log(`[ObjectStorage] Download: ${path}`);
    return null;
  },
  
  getPublicUrl: (path: string) => {
    console.log(`[ObjectStorage] Public URL: ${path}`);
    return "";
  },
  
  delete: async (path: string) => {
    console.log(`[ObjectStorage] Delete: ${path}`);
    return true;
  }
};

export default objectStorage;