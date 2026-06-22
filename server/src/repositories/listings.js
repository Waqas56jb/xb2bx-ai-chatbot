/**
 * Listing repository — persist seller product listings drafted by the assistant.
 */
import db from '../db/index.js';

const insert = db.prepare(`
  INSERT INTO listings (id, title, category, description, price, seller_email, status)
  VALUES (@id, @title, @category, @description, @price, @seller_email, @status)
`);

/** Create a draft listing. Returns the stored record. */
export function createListing(input = {}) {
  const row = {
    id: 'LST-' + Date.now(),
    title: input.title || '',
    category: input.category || '',
    description: input.description || '',
    price: input.price || '',
    seller_email: input.seller_email || '',
    status: 'draft'
  };
  insert.run(row);
  return { ...row, next_step: 'Draft listing saved for the seller to review and publish.' };
}

/** Read listings for the admin dashboard. */
export function listListings({ status, limit = 50 } = {}) {
  const where = status ? 'WHERE status = @status' : '';
  const params = status ? { status, limit } : { limit };
  return db.prepare(`SELECT * FROM listings ${where} ORDER BY created_at DESC LIMIT @limit`).all(params);
}
