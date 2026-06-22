/**
 * Bootstrap configuration — values needed before the database is reachable.
 * Runtime-tunable settings (OpenAI key, models, persona, contact info, etc.)
 * live in the `settings` table and are read via settings.js so the admin panel
 * can change them without a redeploy. The values here are fallbacks/secrets.
 */
import 'dotenv/config';

export const CONFIG = {
  // Server
  port: Number(process.env.PORT || 8787),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Supabase (Postgres) — the database
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // OpenAI fallbacks (used only if the settings table has no value)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  mainModel: process.env.OPENAI_MODEL || 'gpt-4o',
  routerModel: process.env.OPENAI_ROUTER_MODEL || 'gpt-4o-mini',
  temperature: Number(process.env.TEMPERATURE ?? 0.6),
  maxTokens: Number(process.env.MAX_TOKENS || 1400),
  maxToolHops: Number(process.env.MAX_TOOL_HOPS || 6),

  // Admin auth — the admin panel logs in with this token
  adminToken: process.env.ADMIN_TOKEN || ''
};

export function assertConfig() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
    console.warn('\n[config] WARNING: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. Database calls will fail until you add them to .env.\n');
  }
  if (!CONFIG.adminToken) {
    console.warn('[config] WARNING: ADMIN_TOKEN not set — the admin panel will reject all logins.');
  }
}
