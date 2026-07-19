export interface Env {
  DB: D1Database;
  ENVIRONMENT: 'development' | 'test' | 'production';
  APP_ORIGIN: string;
  FIREBASE_PROJECT_ID: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_MONTHLY_PRICE_ID: string;
  STRIPE_YEARLY_PRICE_ID: string;
  BILLING_ENABLED: string;
  OLLAMA_ENABLED: string;
  ABYSS_ENABLED: string;
  FREE_REQUEST_LIMIT: string;
  PRO_REQUEST_LIMIT: string;
  ANON_SESSION_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_REQUIRED: string;
  AI_PROVIDER: string;
  AI_MODEL: string;
  DOCTRINE_VERSION: string;
  INPUT_COST_MICROS_PER_MILLION: string;
  OUTPUT_COST_MICROS_PER_MILLION: string;
}
