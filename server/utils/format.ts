/** 050825 1623CST
 * Format Utilities
 * 
 * Provides helper functions for formatting data consistently.
 */

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }

  return Object.keys(obj).reduce((camelObj, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    let value = obj[key];
    // Recursively convert nested objects
    if (typeof value === 'object' && value !== null) {
      value = snakeToCamel(value);
    }

    camelObj[camelKey] = value;
    return camelObj;
  }, {} as Record<string, any>);
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }

  return Object.keys(obj).reduce((snakeObj, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    let value = obj[key];
    // Recursively convert nested objects
    if (typeof value === 'object' && value !== null) {
      value = camelToSnake(value);
    }

    snakeObj[snakeKey] = value;
    return snakeObj;
  }, {} as Record<string, any>);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  return dateObj.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format a currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format a file size in bytes to human-readable form
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a phone number to (XXX) XXX-XXXX format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length !== 10) {
    return phoneNumber; // Return original if not a valid 10-digit number
  }

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

export default {
  snakeToCamel,
  camelToSnake,
  formatDate,
  formatCurrency,
  formatFileSize,
  formatPhoneNumber
};