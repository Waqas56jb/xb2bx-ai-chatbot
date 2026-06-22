/**
 * Conversation repository — persist chats so the admin panel can review them.
 * A conversation groups messages; each /api/chat turn appends a user + an
 * assistant message and updates the conversation summary fields.
 */
import db from '../db/index.js';

const insertConversation = db.prepare(`
  INSERT INTO conversations (id, session_id, channel, agent, status, message_count, last_message)
  VALUES (@id, @session_id, @channel, @agent, 'open', 0, '')
`);

const insertMessage = db.prepare(`
  INSERT INTO messages (conversation_id, role, agent, content)
  VALUES (@conversation_id, @role, @agent, @content)
`);

const touch = db.prepare(`
  UPDATE conversations
     SET agent = @agent,
         message_count = message_count + @added,
         last_message = @last_message,
         updated_at = datetime('now')
   WHERE id = @id
`);

const findBySession = db.prepare(
  `SELECT * FROM conversations WHERE session_id = @session_id ORDER BY updated_at DESC LIMIT 1`
);

/**
 * Find an existing conversation by id or session, or create a new one.
 * @returns the conversation row
 */
export function getOrCreateConversation({ conversation_id, session_id, channel = 'web' } = {}) {
  if (conversation_id) {
    const existing = db.prepare('SELECT * FROM conversations WHERE id = @id').get({ id: conversation_id });
    if (existing) return existing;
  }
  if (session_id) {
    const bySession = findBySession.get({ session_id });
    if (bySession) return bySession;
  }
  const row = { id: 'CONV-' + Date.now(), session_id: session_id || '', channel, agent: '' };
  insertConversation.run(row);
  return db.prepare('SELECT * FROM conversations WHERE id = @id').get({ id: row.id });
}

/** Append one message to a conversation. */
export function addMessage({ conversation_id, role, agent = '', content = '' }) {
  insertMessage.run({ conversation_id, role, agent, content });
}

/**
 * Record a full turn (user message + assistant reply) and update the summary.
 * @returns the conversation id
 */
export function recordTurn({ conversation_id, session_id, channel, userText, assistantText, agent }) {
  const conv = getOrCreateConversation({ conversation_id, session_id, channel });
  let added = 0;
  if (userText) { addMessage({ conversation_id: conv.id, role: 'user', content: userText }); added++; }
  if (assistantText) { addMessage({ conversation_id: conv.id, role: 'assistant', agent, content: assistantText }); added++; }
  touch.run({
    id: conv.id,
    agent: agent || conv.agent || '',
    added,
    last_message: (assistantText || userText || '').slice(0, 280)
  });
  return conv.id;
}

/** List conversations for the admin dashboard. */
export function listConversations({ status, limit = 50 } = {}) {
  const where = status ? 'WHERE status = @status' : '';
  const params = status ? { status, limit } : { limit };
  return db
    .prepare(`SELECT * FROM conversations ${where} ORDER BY updated_at DESC LIMIT @limit`)
    .all(params);
}

/** Get one conversation with its full message history. */
export function getConversation(id) {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = @id').get({ id });
  if (!conversation) return null;
  const messages = db
    .prepare('SELECT id, role, agent, content, created_at FROM messages WHERE conversation_id = @id ORDER BY id ASC')
    .all({ id });
  return { ...conversation, messages };
}
