/** 050825 1622CST
 * Validation Utilities
 * 
 * Provides helper functions and schemas for data validation.
 */

import { z } from 'zod';

/**
 * Common validation schemas for reuse across the application
 */
export const schemas = {
  // User-related schemas
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  uuid: z.string().uuid('Invalid UUID format'),

  // Common data types
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),

  // Pagination and filtering
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc')
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: 'Start date must be before or equal to end date',
    path: ['startDate']
  }),

  // Campaign related
  campaign: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    deliverables: z.array(z.any()).optional(),
    budgetmin: z.number().optional(),
    budgetmax: z.number().optional(),
    target_sports: z.array(z.string()).optional()
  }),

  // Profile related schemas
  athleteProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    birthdate: z.string().optional(),
    gender: z.string().optional(),
    bio: z.string().optional(),
    school: z.string().optional(),
    division: z.string().optional(),
    graduation_year: z.number().optional(),
    sport: z.string().optional(),
    position: z.string().optional()
  }),

  businessProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional(),
    industry: z.string().optional(),
    business_type: z.string().optional(),
    zipcode: z.string().optional()
  })
};

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  const result = schemas.email.safeParse(email);
  return result.success;
}

/**
 * Validate a UUID
 */
export function isValidUuid(uuid: string): boolean {
  const result = schemas.uuid.safeParse(uuid);
  return result.success;
}

/**
 * Validate a phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove common formatting characters for validation
  const cleaned = phone.replace(/[-()\s]/g, '');
  return /^\d{10}$/.test(cleaned);
}

/**
 * Validate a ZIP code
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
}

/**
 * Validate a credit card number (using Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Check if contains only digits
  if (!/^\d+$/.test(cleaned)) return false;

  // Luhn algorithm
  let sum = 0;
  let double = false;

  // Loop from right to left
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

/**
 * Ensure a value is within the specified range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default {
  schemas,
  isValidEmail,
  isValidUuid,
  isValidPhoneNumber,
  isValidZipCode,
  isValidCreditCard,
  clamp
};