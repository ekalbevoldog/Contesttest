import { Client } from '@replit/object-storage';

// Define interfaces for storage results and client
interface StorageObject {
  name: string;
}

interface UploadResult {
  ok: boolean;
  error?: string;
}

interface DownloadTextResult {
  ok: boolean;
  value: string;
  error?: string;
}

interface DownloadBufferResult {
  ok: boolean;
  value: Buffer;
  error?: string;
}

interface ListResult {
  ok: boolean;
  value: StorageObject[];
  error?: string;
}

interface DeleteResult {
  ok: boolean;
  error?: string;
}

interface StorageClientInterface {
  uploadFromText: (key: string, content: string) => Promise<UploadResult>;
  uploadFromBuffer: (key: string, buffer: Buffer) => Promise<UploadResult>;
  downloadAsText: (key: string) => Promise<DownloadTextResult>;
  downloadAsBuffer: (key: string) => Promise<DownloadBufferResult>;
  list: () => Promise<ListResult>;
  delete: (key: string) => Promise<DeleteResult>;
}

// Create a mock implementation
const createMockClient = (): StorageClientInterface => ({
  async uploadFromText(_key: string, _content: string): Promise<UploadResult> { 
    return { ok: false, error: 'Storage not available' }; 
  },
  async uploadFromBuffer(_key: string, _buffer: Buffer): Promise<UploadResult> { 
    return { ok: false, error: 'Storage not available' }; 
  },
  async downloadAsText(_key: string): Promise<DownloadTextResult> { 
    return { ok: false, value: '', error: 'Storage not available' }; 
  },
  async downloadAsBuffer(_key: string): Promise<DownloadBufferResult> { 
    return { ok: false, value: Buffer.from(''), error: 'Storage not available' }; 
  },
  async list(): Promise<ListResult> { 
    return { ok: false, value: [], error: 'Storage not available' }; 
  },
  async delete(_key: string): Promise<DeleteResult> { 
    return { ok: false, error: 'Storage not available' }; 
  }
});

// Create a real client implementation
const createRealClient = (): StorageClientInterface => {
  try {
    const client = new Client(); // Removed bucketName

    return {
      async uploadFromText(key: string, content: string): Promise<UploadResult> {
        try {
          const result = await client.uploadFromText(key, content);
          if (result.ok) {
            return { ok: true };
          } else {
            return { ok: false, error: result.error.message };
          }
        } catch (error) {
          console.error(`Error uploading text to ${key}:`, error);
          return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      },

      async uploadFromBuffer(key: string, buffer: Buffer): Promise<UploadResult> {
        try {
          const result = await client.uploadFromBytes(key, buffer);
          if (result.ok) {
            return { ok: true };
          } else {
            return { ok: false, error: result.error.message };
          }
        } catch (error) {
          console.error(`Error uploading buffer to ${key}:`, error);
          return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      },

      async downloadAsText(key: string): Promise<DownloadTextResult> {
        try {
          const result = await client.downloadAsText(key);
          if (result.ok) {
            return { ok: true, value: result.value };
          } else {
            return { ok: false, value: '', error: result.error.message };
          }
        } catch (error) {
          console.error(`Error downloading text from ${key}:`, error);
          return { ok: false, value: '', error: error instanceof Error ? error.message : String(error) };
        }
      },

      async downloadAsBuffer(key: string): Promise<DownloadBufferResult> {
        try {
          const result = await client.downloadAsBytes(key);
          if (result.ok) {
            return { ok: true, value: result.value[0] };
          } else {
            return { ok: false, value: Buffer.from(''), error: result.error.message };
          }
        } catch (error) {
          console.error(`Error downloading buffer from ${key}:`, error);
          return { ok: false, value: Buffer.from(''), error: error instanceof Error ? error.message : String(error) };
        }
      },

      async list(): Promise<ListResult> {
        try {
          const result = await client.list();
          if (result.ok) {
            const formattedObjects = result.value.map((obj: any) => ({ name: obj.name }));
            return { ok: true, value: formattedObjects };
          } else {
            return { ok: false, value: [], error: result.error.message };
          }
        } catch (error) {
          console.error('Error listing objects:', error);
          return { ok: false, value: [], error: error instanceof Error ? error.message : String(error) };
        }
      },

      async delete(key: string): Promise<DeleteResult> {
        try {
          const result = await client.delete(key);
          if (result.ok) {
            return { ok: true };
          } else {
            return { ok: false, error: result.error.message };
          }
        } catch (error) {
          console.error(`Error deleting ${key}:`, error);
          return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
    };
  } catch (error) {
    console.error('Failed to initialize Replit Object Storage client:', error);
    // Fall back to mock client if initialization fails
    return createMockClient();
  }
};

// Create a client instance with proper error handling
let storageClient: StorageClientInterface;

// Initialize with the real client using the specified bucket
console.log('Initializing Replit Object Storage with bucket: replit-objstore-baee183f-e7a0-49ac-88ce-a1512085d204');
storageClient = createRealClient();

/**
 * Simple wrapper around Replit Object Storage
 */
export class ObjectStorage {
  /**
   * Upload text content to object storage
   */
  async uploadText(key: string, content: string): Promise<boolean> {
    try {
      const { ok, error } = await storageClient.uploadFromText(key, content);
      if (!ok) {
        console.error(`Error uploading ${key}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Exception uploading ${key}:`, err);
      return false;
    }
  }

  /**
   * Upload binary data to object storage
   */
  async uploadBuffer(key: string, buffer: Buffer): Promise<boolean> {
    try {
      const { ok, error } = await storageClient.uploadFromBuffer(key, buffer);
      if (!ok) {
        console.error(`Error uploading buffer ${key}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Exception uploading buffer ${key}:`, err);
      return false;
    }
  }

  /**
   * Download content as text
   */
  async downloadText(key: string): Promise<string | null> {
    try {
      const { ok, value, error } = await storageClient.downloadAsText(key);
      if (!ok) {
        console.error(`Error downloading ${key}:`, error);
        return null;
      }
      return value;
    } catch (err) {
      console.error(`Exception downloading ${key}:`, err);
      return null;
    }
  }

  /**
   * Download content as binary buffer
   */
  async downloadBuffer(key: string): Promise<Buffer | null> {
    try {
      const { ok, value, error } = await storageClient.downloadAsBuffer(key);
      if (!ok) {
        console.error(`Error downloading buffer ${key}:`, error);
        return null;
      }
      return value;
    } catch (err) {
      console.error(`Exception downloading buffer ${key}:`, err);
      return null;
    }
  }

  /**
   * List objects in storage
   */
  async listObjects(): Promise<string[]> {
    try {
      const { ok, value, error } = await storageClient.list();
      if (!ok) {
        console.error('Error listing objects:', error);
        return [];
      }
      return value.map((obj: StorageObject) => obj.name);
    } catch (err) {
      console.error('Exception listing objects:', err);
      return [];
    }
  }

  /**
   * Delete an object from storage
   */
  async deleteObject(key: string): Promise<boolean> {
    try {
      const { ok, error } = await storageClient.delete(key);
      if (!ok) {
        console.error(`Error deleting ${key}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Exception deleting ${key}:`, err);
      return false;
    }
  }
}

export const objectStorage = new ObjectStorage();