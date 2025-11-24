import { validateEnvironment, logValidationResults } from './lib/env-validation';

// Validate environment variables on module load
const envValidation = validateEnvironment();

// Log validation results in development
if (process.env.NODE_ENV === 'development') {
  logValidationResults(envValidation);
}

// Environment variables configuration (NO fallbacks - must be set in .env)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// API Configuration
export const INTERVIEWS_API_BASE = API_BASE_URL;
export const INTERVIEWS_JWT = process.env.INTERVIEWS_JWT!;

// Participants API URLs
export const PARTICIPANTS_LIST_URL = `${API_BASE_URL}/api/user/listPracticantes/v2`;
export const PARTICIPANTS_CREATE_URL = `${API_BASE_URL}/api/user/create`;
export const PARTICIPANTS_JWT = INTERVIEWS_JWT;

// OpenRouter AI Configuration
export const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL!;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
export const OPENROUTER_REFERER = process.env.NEXT_PUBLIC_OPENROUTER_REFERER!;
export const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE!;

// API Timeout Configuration
export const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT!);

// Export validation results for use in other modules
export const ENV_VALIDATION = envValidation;

// Legacy validation function (kept for backward compatibility)
export const validateEnvironmentVariables = () => {
  return envValidation.isValid;
};
