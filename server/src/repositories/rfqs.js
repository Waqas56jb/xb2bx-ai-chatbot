/**
 * RFQ repository — persist Requests For Quote created by the assistant.
 */
import db from '../db/index.js';

const insert = db.prepare(`
  INSERT INTO rfqs (id, product, quantity, target_country, delivery_timeline, contact_email, notes, status)
  VALUES (@id, @product, @quantity, @target_country, @delivery_timeline, @contact_email, @notes, @status)
`);

/** Create an RFQ. Returns the stored record + guidance for the assistant. */
export function createRfq(input = {}) {
  const row = {
    id: 'RFQ-' + Date.now(),
    product: input.product || '',
    quantity: Number(input.quantity) || 0,
    target_country: input.target_country || '',
    delivery_timeline: input.delivery_timeline || '',
    contact_email: input.contact_email || '',
    notes: input.notes || '',
    status: 'created'
  };
  insert.run(row);
  return {
    ...row,
    next_step:
      'RFQ created. It will be routed to matched verified suppliers; quotes come back to the buyer. Offer to capture a contact email if not provided.'
  };
}

/** Read RFQs for the admin dashboard. */
export function listRfqs({ status, limit = 50 } = {}) {
  const where = status ? 'WHERE status = @status' : '';
  const params = status ? { status, limit } : { limit };
  return db.prepare(`SELECT * FROM rfqs ${where} ORDER BY created_at DESC LIMIT @limit`).all(params);
}
