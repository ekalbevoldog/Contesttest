
import { Client } from '@replit/object-storage';

// Create a client instance 
const storageClient = new Client();

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
      return value.map(obj => obj.name);
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
