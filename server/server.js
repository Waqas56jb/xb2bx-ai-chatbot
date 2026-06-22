/**
 * XB2BX Assistant — server entry point (OpenAI-powered).
 *
 * Public:
 *   GET  /api/health                      -> { ok, model }
 *   POST /api/chat                        { messages, session_id?, conversation_id? }
 *                                         -> { reply, agent, actions, conversation_id }
 *
 * Admin (require `Authorization: Bearer <ADMIN_TOKEN>`):
 *   GET  /api/admin/stats                 -> dashboard counts
 *   GET  /api/admin/leads                 ?tier=&status=
 *   GET  /api/admin/conversations         ?status=
 *   GET  /api/admin/conversations/:id     -> conversation + messages
 *   GET  /api/admin/rfqs                  ?status=
 *   GET  /api/admin/listings              ?status=
 *   GET  /api/admin/tickets               ?status=
 *   GET  /api/admin/escalations           ?status=
 *
 * Run:  npm install && npm run seed && npm start
 */
import express from 'express';
import cors from 'cors';
import { CONFIG, assertConfig } from './src/config.js';
import { routeAgent, reply } from './src/llm.js';
import { recordTurn, listConversations, getConversation } from './src/repositories/conversations.js';
import { listLeads } from './src/repositories/leads.js';
import { listRfqs } from './src/repositories/rfqs.js';
import { listListings } from './src/repositories/listings.js';
import { listTickets, listEscalations } from './src/repositories/tickets.js';
import { getStats } from './src/repositories/analytics.js';

assertConfig();

const app = express();
app.use(express.json({ limit: '256kb' }));

const corsOrigin = CONFIG.allowedOrigins.includes('*') ? true : CONFIG.allowedOrigins;
app.use(cors({ origin: corsOrigin, methods: ['POST', 'GET', 'OPTIONS'] }));

// ---- Helpers ----
function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join(' ');
  return '';
}

// Admin auth middleware.
function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!CONFIG.adminToken || token !== CONFIG.adminToken) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// ---- Public ----
app.get('/api/health', (_req, res) => res.json({ ok: true, model: CONFIG.mainModel }));

app.post('/api/chat', async (req, res) => {
  const { messages, session_id, conversation_id, channel } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Expected { messages: [...] }' });
  }
  if (messages.length > 40) return res.status(413).json({ error: 'Conversation too long' });

  try {
    const agentKey = await routeAgent(messages);
    const result = await reply(messages, agentKey);

    let convId = conversation_id || null;
    if (CONFIG.persistConversations) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      try {
        convId = recordTurn({
          conversation_id,
          session_id,
          channel,
          userText: textOf(lastUser?.content),
          assistantText: result.reply,
          agent: result.agent
        });
      } catch (e) {
        console.error('[persist] failed:', e?.message || e); // never block a reply on persistence
      }
    }

    res.json({ ...result, conversation_id: convId });
  } catch (err) {
    console.error('chat error:', err);
    res.status(500).json({
      error: 'server',
      reply:
        "I couldn't complete that just now. Please try again, or contact the XB2BX team and we'll help directly."
    });
  }
});

// ---- Admin API (powers the admin panel) ----
app.get('/api/admin/stats', requireAdmin, (_req, res) => res.json(getStats()));

app.get('/api/admin/leads', requireAdmin, (req, res) => {
  const { tier, status } = req.query;
  res.json({ leads: listLeads({ tier, status }) });
});

app.get('/api/admin/conversations', requireAdmin, (req, res) => {
  res.json({ conversations: listConversations({ status: req.query.status }) });
});

app.get('/api/admin/conversations/:id', requireAdmin, (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'not found' });
  res.json({ conversation });
});

app.get('/api/admin/rfqs', requireAdmin, (req, res) => res.json({ rfqs: listRfqs({ status: req.query.status }) }));
app.get('/api/admin/listings', requireAdmin, (req, res) => res.json({ listings: listListings({ status: req.query.status }) }));
app.get('/api/admin/tickets', requireAdmin, (req, res) => res.json({ tickets: listTickets({ status: req.query.status }) }));
app.get('/api/admin/escalations', requireAdmin, (req, res) =>
  res.json({ escalations: listEscalations({ status: req.query.status }) })
);

// Back-compat alias for the original endpoint.
app.get('/api/leads', requireAdmin, (req, res) => {
  const { tier, status } = req.query;
  res.json({ leads: listLeads({ tier, status }) });
});

app.listen(CONFIG.port, () => console.log(`XB2BX Assistant backend (OpenAI ${CONFIG.mainModel}) on :${CONFIG.port}`));
