import { CONFIG } from './config.js';

/** Stable per-browser session id so the backend can group a conversation. */
export function getSessionId() {
  const KEY = 'xb2bx_session_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Send the conversation to the backend.
 * @returns {Promise<{reply:string, agent:string, actions:any[], conversation_id:string}>}
 */
export async function sendMessage({ messages, sessionId, conversationId }) {
  const res = await fetch(CONFIG.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      session_id: sessionId,
      conversation_id: conversationId || null
    })
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.reply || '';
    } catch {
      /* ignore */
    }
    const err = new Error(detail || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
