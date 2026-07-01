/**
 * Admin accounts (Supabase) — org staff logins for the admin panel.
 *
 * The owner account is seeded from ADMIN_EMAIL / ADMIN_PASSWORD on first boot.
 * Login falls back to the env owner if the admin_users table doesn't exist yet
 * or has no rows, so the panel keeps working before the table is created.
 */
import { supabase, unwrap, clean } from '../db/supabase.js';
import { CONFIG } from '../config.js';

const norm = (e) => (e || '').trim().toLowerCase();

/** Seed the owner account from env if the table is empty. Idempotent. */
export async function ensureOwner() {
  try {
    const { count, error } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
    if (error) return; // table missing — env fallback covers login
    if (!count && CONFIG.adminEmail && CONFIG.adminPassword) {
      await supabase.from('admin_users').insert({ email: norm(CONFIG.adminEmail), password: CONFIG.adminPassword, role: 'owner' });
      console.log('[bootstrap] seeded owner admin account.');
    }
  } catch {
    /* ignore */
  }
}

/** Verify an email/password login. Returns { email, role } or null. */
export async function verifyLogin(email, password) {
  const em = norm(email);
  try {
    const { data, error } = await supabase.from('admin_users').select('email, password, role').eq('email', em).maybeSingle();
    if (!error) {
      if (data) return data.password === password ? { email: data.email, role: data.role } : null;
      // No such account. If the table has ANY accounts, reject; else fall through to env.
      const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
      if (count) return null;
    }
  } catch {
    /* table missing — env fallback */
  }
  if (em === norm(CONFIG.adminEmail) && password === CONFIG.adminPassword) return { email: em, role: 'owner' };
  return null;
}

// ---- CRUD (admin-only) ----
export async function listAccounts() {
  return unwrap(
    await supabase.from('admin_users').select('id, email, password, role, created_at').order('created_at', { ascending: true }),
    'listAccounts'
  );
}

export async function createAccount({ email, password, role = 'member' } = {}) {
  const em = norm(email);
  if (!em || !password) throw new Error('Email and password are required.');
  const r = role === 'owner' ? 'owner' : 'member';
  return unwrap(await supabase.from('admin_users').insert({ email: em, password, role: r }).select().single(), 'createAccount');
}

export async function updateAccount(id, patch = {}) {
  patch = clean(patch);
  if (patch.email) patch.email = norm(patch.email);
  if (patch.role && patch.role !== 'owner') patch.role = 'member';
  if ('password' in patch && !patch.password) delete patch.password; // don't blank a password
  return unwrap(await supabase.from('admin_users').update(patch).eq('id', id).select().single(), 'updateAccount');
}

export async function deleteAccount(id) {
  const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
  if ((count || 0) <= 1) throw new Error('Cannot delete the last remaining account.');
  unwrap(await supabase.from('admin_users').delete().eq('id', id), 'deleteAccount');
  return { id, deleted: true };
}
