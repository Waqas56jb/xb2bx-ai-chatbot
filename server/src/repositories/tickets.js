/**
 * Support repository — support tickets and human-handoff escalations.
 */
import db from '../db/index.js';

const insertTicket = db.prepare(`
  INSERT INTO support_tickets (id, subject, description, contact_email, priority, status)
  VALUES (@id, @subject, @description, @contact_email, @priority, @status)
`);

const insertEscalation = db.prepare(`
  INSERT INTO escalations (id, reason, contact_email, contact_phone, status)
  VALUES (@id, @reason, @contact_email, @contact_phone, @status)
`);

/** Open a support ticket. Returns the stored record. */
export function createTicket(input = {}) {
  const row = {
    id: 'TKT-' + Date.now(),
    subject: input.subject || '',
    description: input.description || '',
    contact_email: input.contact_email || '',
    priority: ['low', 'normal', 'high'].includes(input.priority) ? input.priority : 'normal',
    status: 'open'
  };
  insertTicket.run(row);
  return { ...row, next_step: 'Ticket opened. The team will follow up; share the ticket id with the user.' };
}

/** Queue a human-handoff escalation. Returns the stored record. */
export function createEscalation(input = {}) {
  const row = {
    id: 'ESC-' + Date.now(),
    reason: input.reason || '',
    contact_email: input.contact_email || '',
    contact_phone: input.contact_phone || '',
    status: 'queued'
  };
  insertEscalation.run(row);
  return {
    ...row,
    queue: 'live-agents',
    next_step: 'Escalated to a human agent. Reassure the user that the team will reach out.'
  };
}

/** Read tickets for the admin dashboard. */
export function listTickets({ status, limit = 50 } = {}) {
  const where = status ? 'WHERE status = @status' : '';
  const params = status ? { status, limit } : { limit };
  return db.prepare(`SELECT * FROM support_tickets ${where} ORDER BY created_at DESC LIMIT @limit`).all(params);
}

/** Read escalations for the admin dashboard. */
export function listEscalations({ status, limit = 50 } = {}) {
  const where = status ? 'WHERE status = @status' : '';
  const params = status ? { status, limit } : { limit };
  return db.prepare(`SELECT * FROM escalations ${where} ORDER BY created_at DESC LIMIT @limit`).all(params);
}
