/**
 * Environment Variables Validation
 * Validates required environment variables at application startup
 */

interface EnvironmentConfig {
  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;
  APP_URL: string;
  
  // Authentication
  INTERVIEWS_JWT: string;
  
  // OpenRouter AI
  OPENROUTER_BASE_URL: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_REFERER: string;
  OPENROUTER_TITLE: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvironmentConfig>;
}

/**
 * Validates all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required variables
  const requiredVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'INTERVIEWS_JWT',
    'OPENROUTER_API_KEY'
  ];
  
  // Optional variables with defaults
  const optionalVars = [
    'NEXT_PUBLIC_API_TIMEOUT',
    'NEXT_PUBLIC_APP_URL',
    'OPENROUTER_BASE_URL',
    'NEXT_PUBLIC_OPENROUTER_REFERER',
    'OPENROUTER_TITLE'
  ];
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Check optional variables
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Optional environment variable not set: ${varName} (using default)`);
    }
  });
  
  // Validate JWT format
  if (process.env.INTERVIEWS_JWT && !isValidJWT(process.env.INTERVIEWS_JWT)) {
    errors.push('INTERVIEWS_JWT appears to be invalid (not a valid JWT format)');
  }
  
  // Validate URLs
  if (process.env.NEXT_PUBLIC_API_BASE_URL && !isValidURL(process.env.NEXT_PUBLIC_API_BASE_URL)) {
    errors.push('NEXT_PUBLIC_API_BASE_URL is not a valid URL');
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL && !isValidURL(process.env.NEXT_PUBLIC_APP_URL)) {
    warnings.push('NEXT_PUBLIC_APP_URL is not a valid URL');
  }
  
  // Validate API timeout
  const timeout = process.env.NEXT_PUBLIC_API_TIMEOUT;
  if (timeout && (isNaN(Number(timeout)) || Number(timeout) < 1000)) {
    warnings.push('NEXT_PUBLIC_API_TIMEOUT should be a number >= 1000 (milliseconds)');
  }
  
  // Build config object (only for validation display - actual code uses direct env vars)
  const config: Partial<EnvironmentConfig> = {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '[NOT SET]',
    API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '120000'),
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || '[NOT SET]',
    INTERVIEWS_JWT: process.env.INTERVIEWS_JWT || '[NOT SET]',
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || '[NOT SET]',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '[NOT SET]',
    OPENROUTER_REFERER: process.env.NEXT_PUBLIC_OPENROUTER_REFERER || '[NOT SET]',
    OPENROUTER_TITLE: process.env.OPENROUTER_TITLE || '[NOT SET]'
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Validates JWT format (basic check)
 */
function isValidJWT(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Validates URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Logs validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  console.log('\n🔧 Environment Variables Validation');
  console.log('=====================================');
  
  if (result.isValid) {
    console.log('✅ All required environment variables are properly configured');
  } else {
    console.log('❌ Environment validation failed');
  }
  
  // Log errors
  if (result.errors.length > 0) {
    console.log('\n🚨 Errors:');
    result.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  // Log warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }
  
  // Log configuration summary
  console.log('\n📋 Configuration Summary:');
  console.log(`  • API Base URL: ${result.config.API_BASE_URL}`);
  console.log(`  • API Timeout: ${result.config.API_TIMEOUT}ms`);
  console.log(`  • App URL: ${result.config.APP_URL}`);
  console.log(`  • JWT Token: ${result.config.INTERVIEWS_JWT ? '✅ Set' : '❌ Missing'}`);
  console.log(`  • OpenRouter API Key: ${result.config.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  • OpenRouter Base URL: ${result.config.OPENROUTER_BASE_URL}`);
  
  console.log('=====================================\n');
}

/**
 * Validates environment and throws if invalid (for build-time validation)
 */
export function validateEnvironmentOrThrow(): EnvironmentConfig {
  const result = validateEnvironment();
  
  if (!result.isValid) {
    logValidationResults(result);
    throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
  }
  
  if (result.warnings.length > 0) {
    logValidationResults(result);
  }
  
  return result.config as EnvironmentConfig;
}
