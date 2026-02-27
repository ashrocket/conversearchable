import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const EnvSchema = z.object({
  // Server
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Auth
  JWT_SECRET: z.string().min(16).default('dev-jwt-secret-change-me-in-prod'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),

  // Google Calendar OAuth2
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional().default('http://localhost:3000/auth/google/callback'),

  // Duffel
  DUFFEL_API_TOKEN: z.string().optional(),

  // Geocoding
  OPENCAGE_API_KEY: z.string().optional(),

  // Feature flags
  USE_MOCK_CALENDAR: z.string().default('true').transform((v) => v === 'true'),
  USE_MOCK_FLIGHTS: z.string().default('true').transform((v) => v === 'true'),
  USE_MOCK_LLM: z.string().default('true').transform((v) => v === 'true'),
  USE_MOCK_GEOCODING: z.string().default('true').transform((v) => v === 'true'),
});

export type AppConfig = z.infer<typeof EnvSchema>;

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) return _config;

  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment configuration error:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Invalid environment configuration. See errors above.');
  }

  _config = result.data;

  // Warn about mock mode
  if (_config.NODE_ENV !== 'test') {
    const mocks: string[] = [];
    if (_config.USE_MOCK_CALENDAR) mocks.push('Calendar');
    if (_config.USE_MOCK_FLIGHTS) mocks.push('Flights');
    if (_config.USE_MOCK_LLM) mocks.push('LLM');
    if (_config.USE_MOCK_GEOCODING) mocks.push('Geocoding');
    if (mocks.length > 0) {
      console.log(`[Config] Mock mode enabled for: ${mocks.join(', ')}`);
    }
  }

  // Warn about missing API keys when not in mock mode
  if (!_config.USE_MOCK_LLM && !_config.ANTHROPIC_API_KEY) {
    console.warn('[Config] WARNING: ANTHROPIC_API_KEY not set but mock LLM is disabled');
  }
  if (!_config.USE_MOCK_FLIGHTS && !_config.DUFFEL_API_TOKEN) {
    console.warn('[Config] WARNING: DUFFEL_API_TOKEN not set but mock flights is disabled');
  }
  if (!_config.USE_MOCK_CALENDAR && (!_config.GOOGLE_CLIENT_ID || !_config.GOOGLE_CLIENT_SECRET)) {
    console.warn('[Config] WARNING: Google OAuth credentials not set but mock calendar is disabled');
  }

  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) {
    return loadConfig();
  }
  return _config;
}
