/**
 * Central configuration — every environment-driven knob in one place.
 * Read once at startup so the rest of the code never touches process.env.
 */
import 'dotenv/config';

function bool(v, fallback = false) {
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

export const CONFIG = {
  // Server
  port: Number(process.env.PORT || 8787),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  // Main agents run on a high-quality model; the router runs on a fast/cheap one.
  mainModel: process.env.OPENAI_MODEL || 'gpt-4o',
  routerModel: process.env.OPENAI_ROUTER_MODEL || 'gpt-4o-mini',
  temperature: Number(process.env.TEMPERATURE ?? 0.6),
  maxTokens: Number(process.env.MAX_TOKENS || 1400),
  maxToolHops: Number(process.env.MAX_TOOL_HOPS || 6),

  // Admin (leads / conversations / analytics dashboard)
  adminToken: process.env.ADMIN_TOKEN || '',

  // Persistence
  persistConversations: bool(process.env.PERSIST_CONVERSATIONS, true)
};

/** Fail fast with a clear message if the API key is missing. */
export function assertConfig() {
  if (!CONFIG.openaiApiKey) {
    console.warn(
      '\n[config] WARNING: OPENAI_API_KEY is not set. Copy .env.example to .env ' +
        'and paste your OpenAI key, or chat requests will fail.\n'
    );
  }
}
