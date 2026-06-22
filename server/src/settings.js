/**
 * Runtime settings — stored in the `settings` table (key/value) so the admin
 * panel can control the chatbot live: OpenAI key & models, temperature, persona,
 * contact info, and an on/off switch. Cached briefly to avoid hammering the DB.
 */
import { supabase } from './db/supabase.js';
import { CONFIG } from './config.js';

const CACHE_TTL_MS = 8000;
let cache = null;
let cacheAt = 0;

/** Default values, overlaid by whatever is in the DB. */
function defaults() {
  return {
    bot_enabled: 'true',
    openai_api_key: CONFIG.openaiApiKey,
    openai_model: CONFIG.mainModel,
    openai_router_model: CONFIG.routerModel,
    temperature: String(CONFIG.temperature),
    max_tokens: String(CONFIG.maxTokens),
    persona_extra: '',
    company_name: 'XB2BX',
    contact_email: '',
    contact_phone: '',
    contact_hours: ''
  };
}

/** Read all settings (cached). Returns a plain { key: value } object. */
export async function getSettings({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache && now - cacheAt < CACHE_TTL_MS) return cache;

  const merged = defaults();
  try {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (!error && Array.isArray(data)) {
      for (const row of data) if (row.value !== null && row.value !== undefined) merged[row.key] = row.value;
    }
  } catch {
    /* fall back to defaults */
  }
  cache = merged;
  cacheAt = now;
  return merged;
}

/** Effective, typed config the LLM layer needs (validated/clamped). */
export async function getEffectiveConfig() {
  const s = await getSettings();

  let temperature = Number(s.temperature);
  if (!Number.isFinite(temperature)) temperature = CONFIG.temperature;
  temperature = Math.min(2, Math.max(0, temperature));

  let maxTokens = parseInt(s.max_tokens, 10);
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = CONFIG.maxTokens;
  maxTokens = Math.min(8000, Math.max(64, maxTokens));

  return {
    botEnabled: s.bot_enabled !== 'false',
    apiKey: s.openai_api_key || CONFIG.openaiApiKey,
    mainModel: (s.openai_model || CONFIG.mainModel).trim(),
    routerModel: (s.openai_router_model || CONFIG.routerModel).trim(),
    temperature,
    maxTokens,
    personaExtra: s.persona_extra || '',
    contact: { email: s.contact_email, phone: s.contact_phone, hours: s.contact_hours }
  };
}

/** Upsert one or more settings (admin). Clears the cache. */
export async function updateSettings(patch = {}) {
  const rows = Object.entries(patch).map(([key, value]) => ({ key, value: value == null ? '' : String(value) }));
  if (rows.length) {
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    if (error) throw new Error('[settings:update] ' + error.message);
  }
  cache = null;
  return getSettings({ force: true });
}

/** Settings safe to send to the admin UI (API key masked). */
export async function getSettingsForAdmin() {
  const s = await getSettings({ force: true });
  const masked = { ...s };
  if (masked.openai_api_key) {
    const k = masked.openai_api_key;
    masked.openai_api_key_set = true;
    masked.openai_api_key = k.length > 10 ? `${k.slice(0, 6)}…${k.slice(-4)}` : '••••••';
  } else {
    masked.openai_api_key_set = false;
    masked.openai_api_key = '';
  }
  return masked;
}
