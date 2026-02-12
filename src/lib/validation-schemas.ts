import { z } from 'zod';

// Common validation patterns
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_NOTES_LENGTH = 1000;

// Crop form validation schema
export const cropSchema = z.object({
  crop_name: z.string()
    .trim()
    .min(1, 'Crop name is required')
    .max(MAX_NAME_LENGTH, `Crop name must be less than ${MAX_NAME_LENGTH} characters`),
  crop_type: z.string()
    .trim()
    .min(1, 'Crop type is required')
    .max(MAX_NAME_LENGTH, `Crop type must be less than ${MAX_NAME_LENGTH} characters`),
  planting_date: z.string()
    .min(1, 'Planting date is required'),
  harvest_date: z.string().optional(),
  expected_yield: z.number().min(0, 'Expected yield must be positive').optional(),
  market_price: z.number().min(0, 'Market price must be positive').optional(),
  notes: z.string()
    .max(MAX_NOTES_LENGTH, `Notes must be less than ${MAX_NOTES_LENGTH} characters`)
    .optional(),
});

// Expense form validation schema
export const expenseSchema = z.object({
  category: z.string()
    .min(1, 'Category is required'),
  amount: z.number()
    .positive('Amount must be greater than 0'),
  description: z.string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  expense_date: z.string()
    .min(1, 'Date is required'),
  crop_id: z.string().min(1, 'Please select a crop'),
});

// Income form validation schema
export const incomeSchema = z.object({
  source: z.string()
    .min(1, 'Source is required'),
  amount: z.number()
    .positive('Amount must be greater than 0'),
  description: z.string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  income_date: z.string()
    .min(1, 'Date is required'),
  crop_id: z.string().min(1, 'Please select a crop'),
});

// Auth form validation schema
export const authSchema = z.object({
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  fullName: z.string()
    .trim()
    .min(1, 'Full name is required')
    .max(MAX_NAME_LENGTH, `Full name must be less than ${MAX_NAME_LENGTH} characters`)
    .optional(),
  farmName: z.string()
    .trim()
    .max(MAX_NAME_LENGTH, `Farm name must be less than ${MAX_NAME_LENGTH} characters`)
    .optional(),
});

// Helper function to format Zod validation errors
export function formatValidationError(error: z.ZodError): string {
  const firstError = error.errors[0];
  return firstError?.message || 'Invalid input data.';
}
