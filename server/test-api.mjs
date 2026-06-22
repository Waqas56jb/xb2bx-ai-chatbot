// Full API test harness. Run while the server is up: node test-api.mjs
const BASE = 'http://localhost:8787/api';
const TOKEN = 'change-me-to-a-long-random-string';
const H = { 'Content-Type': 'application/json' };
const AH = { ...H, Authorization: `Bearer ${TOKEN}` };

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { (cond ? pass++ : fail++); console.log(`${cond ? '✓' : '✗ FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); };

async function j(path, opts) { const r = await fetch(BASE + path, opts); let d = null; try { d = await r.json(); } catch {} return { status: r.status, d }; }

async function chat(content, extra = {}) {
  return j('/chat', { method: 'POST', headers: H, body: JSON.stringify({ messages: [{ role: 'user', content }], ...extra }) });
}

async function streamChat(content) {
  const r = await fetch(BASE + '/chat/stream', { method: 'POST', headers: H, body: JSON.stringify({ messages: [{ role: 'user', content }], session_id: 'stream-x' }) });
  const text = await r.text();
  const tokens = (text.match(/event: token/g) || []).length;
  const done = text.includes('event: done');
  return { tokens, done, hasMeta: text.includes('event: meta') };
}

console.log('\n=== PUBLIC ===');
{
  const { d } = await j('/health');
  ok('health ok', d?.ok === true, `model=${d?.model}`);
}
{
  const { status } = await chat('');
  ok('chat empty messages -> 400', status === 400);
}
{
  const { status, d } = await j('/chat', { method: 'POST', headers: H, body: JSON.stringify({}) });
  ok('chat no body -> 400', status === 400);
}

console.log('\n=== CHAT FLOWS (OpenAI + tools + Supabase persistence) ===');
let convId = null;
{
  const { d } = await chat('I want to source 10,000 units of eco-friendly packaging from Vietnam', { session_id: 'buyer-1' });
  ok('buyer -> Trade Advisor', d?.agent === 'Trade Advisor', `agent=${d?.agent}`);
  ok('buyer -> used search tool', (d?.actions || []).some((a) => a.tool.includes('search')), `tools=${(d?.actions||[]).map(a=>a.tool)}`);
  ok('chat returns conversation_id', !!d?.conversation_id);
  ok('reply has markdown table', /\|/.test(d?.reply || ''));
  convId = d?.conversation_id;
}
{
  const { d } = await chat('Im John, budget 500k USD, franchise partnership, 2 month timeline, email john@x.com, Dubai', { session_id: 'lead-1' });
  ok('lead capture -> qualify_lead', (d?.actions || []).some((a) => a.tool === 'qualify_lead'), `tools=${(d?.actions||[]).map(a=>a.tool)}`);
}
{
  const { d } = await chat('Create an RFQ for 5000 recyclable mailer boxes to UK, 6 weeks, buyer@acme.com', { session_id: 'rfq-1' });
  ok('rfq -> create_rfq', (d?.actions || []).some((a) => a.tool === 'create_rfq'));
}
{
  const { d } = await chat('Can I sell firearms here?', { session_id: 'pol-1' });
  ok('prohibited -> check_prohibited_item', (d?.actions || []).some((a) => a.tool === 'check_prohibited_item'));
}
{
  const { d } = await chat('I have a technical bug with my account login, please help', { session_id: 'tkt-1' });
  ok('support flow handled', !!d?.reply, `agent=${d?.agent}`);
}

console.log('\n=== STREAMING ===');
{
  const s = await streamChat('In one sentence, what is XB2BX?');
  ok('stream sends meta', s.hasMeta);
  ok('stream sends many tokens', s.tokens > 3, `tokens=${s.tokens}`);
  ok('stream sends done', s.done);
}

console.log('\n=== ADMIN AUTH ===');
ok('admin no token -> 401', (await j('/admin/stats')).status === 401);
ok('admin bad token -> 401', (await j('/admin/stats', { headers: { Authorization: 'Bearer nope' } })).status === 401);
ok('admin login bad -> 401', (await j('/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ token: 'x' }) })).status === 401);
ok('admin login good -> ok', (await j('/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ token: TOKEN }) })).d?.ok === true);

console.log('\n=== ADMIN STATS / READS ===');
{
  const { d } = await j('/admin/stats', { headers: AH });
  ok('stats conversations>0', d?.conversations > 0, `conv=${d?.conversations}`);
  ok('stats leads>0', d?.leads?.total > 0, `leads=${d?.leads?.total}`);
  ok('stats rfqs>0', d?.rfqs > 0, `rfqs=${d?.rfqs}`);
}
ok('list conversations', Array.isArray((await j('/admin/conversations', { headers: AH })).d?.conversations));
{
  const { d } = await j(`/admin/conversations/${convId}`, { headers: AH });
  ok('conversation detail has messages', (d?.conversation?.messages || []).length >= 2);
}
ok('conversation 404', (await j('/admin/conversations/CONV-nope', { headers: AH })).status === 404);

console.log('\n=== ADMIN SETTINGS ===');
{
  const { d } = await j('/admin/settings', { headers: AH });
  ok('settings key masked', d?.settings?.openai_api_key?.includes('…') || d?.settings?.openai_api_key_set === true, `key=${d?.settings?.openai_api_key}`);
  // Edge case: PUT masked key should NOT overwrite real key
  await j('/admin/settings', { method: 'PUT', headers: AH, body: JSON.stringify({ openai_api_key: d.settings.openai_api_key, persona_extra: 'Always be extra concise.' }) });
  const after = await j('/admin/settings', { headers: AH });
  ok('persona updated', after.d?.settings?.persona_extra === 'Always be extra concise.');
  ok('masked key NOT saved over real key', after.d?.settings?.openai_api_key_set === true);
  await j('/admin/settings', { method: 'PUT', headers: AH, body: JSON.stringify({ persona_extra: '' }) }); // reset
}

console.log('\n=== ADMIN TRAINING (knowledge) ===');
{
  const { d } = await j('/admin/knowledge', { headers: AH });
  ok('knowledge list seeded', (d?.knowledge || []).length >= 14, `count=${d?.knowledge?.length}`);
  // Use a throwaway section so we never corrupt the real "company" content.
  await j('/admin/knowledge/__test__', { method: 'PUT', headers: AH, body: JSON.stringify({ title: 'Test', content: 'TEST CONTENT XYZ', enabled: true }) });
  const one = await j('/admin/knowledge/__test__', { headers: AH });
  ok('knowledge edit saved', one.d?.knowledge?.content === 'TEST CONTENT XYZ');
  await j('/admin/knowledge/__test__', { method: 'DELETE', headers: AH });
  // new section + delete
  await j('/admin/knowledge/test_sec', { method: 'PUT', headers: AH, body: JSON.stringify({ title: 'T', content: 'temp', enabled: false }) });
  ok('knowledge add', (await j('/admin/knowledge/test_sec', { headers: AH })).d?.knowledge?.key === 'test_sec');
  ok('knowledge delete', (await j('/admin/knowledge/test_sec', { method: 'DELETE', headers: AH })).d?.deleted === true);
}

console.log('\n=== ADMIN SUPPLIERS CRUD ===');
{
  const created = await j('/admin/suppliers', { method: 'POST', headers: AH, body: JSON.stringify({ name: 'Test Supplier', country: 'Testland', categories: 'packaging', verified: true, rating: 4.2 }) });
  const id = created.d?.supplier?.id;
  ok('supplier create', !!id);
  ok('supplier verified=1', created.d?.supplier?.verified === 1);
  const upd = await j(`/admin/suppliers/${id}`, { method: 'PATCH', headers: AH, body: JSON.stringify({ rating: 4.9, verified: false }) });
  ok('supplier update', upd.d?.supplier?.rating === 4.9 && upd.d?.supplier?.verified === 0);
  ok('supplier delete', (await j(`/admin/suppliers/${id}`, { method: 'DELETE', headers: AH })).d?.deleted === true);
}

console.log('\n=== ADMIN PRODUCTS CRUD ===');
{
  const created = await j('/admin/products', { method: 'POST', headers: AH, body: JSON.stringify({ title: 'Test Product', category: 'packaging', moq: 100, price: '$1/u' }) });
  const id = created.d?.product?.id;
  ok('product create', !!id);
  ok('product update', (await j(`/admin/products/${id}`, { method: 'PATCH', headers: AH, body: JSON.stringify({ price: '$2/u' }) })).d?.product?.price === '$2/u');
  ok('product delete', (await j(`/admin/products/${id}`, { method: 'DELETE', headers: AH })).d?.deleted === true);
}

console.log('\n=== ADMIN LEADS / RFQS / TICKETS / ESCALATIONS ===');
{
  const leads = (await j('/admin/leads', { headers: AH })).d?.leads || [];
  ok('leads listed', leads.length > 0);
  if (leads[0]) {
    ok('lead status update', (await j(`/admin/leads/${leads[0].id}`, { method: 'PATCH', headers: AH, body: JSON.stringify({ status: 'contacted' }) })).d?.lead?.status === 'contacted');
  }
  const rfqs = (await j('/admin/rfqs', { headers: AH })).d?.rfqs || [];
  ok('rfqs listed', rfqs.length > 0);
  if (rfqs[0]) ok('rfq status update', (await j(`/admin/rfqs/${rfqs[0].id}`, { method: 'PATCH', headers: AH, body: JSON.stringify({ status: 'sent' }) })).d?.rfq?.status === 'sent');
  ok('listings listed', Array.isArray((await j('/admin/listings', { headers: AH })).d?.listings));
  ok('tickets listed', Array.isArray((await j('/admin/tickets', { headers: AH })).d?.tickets));
  ok('escalations listed', Array.isArray((await j('/admin/escalations', { headers: AH })).d?.escalations));
}

console.log('\n=== EDGE: bot on/off ===');
{
  await j('/admin/settings', { method: 'PUT', headers: AH, body: JSON.stringify({ bot_enabled: 'false' }) });
  await new Promise((r) => setTimeout(r, 9000)); // settings cache TTL 8s
  const offReply = await chat('hello', { session_id: 'off-1' });
  ok('bot off -> maintenance msg', /unavailable/i.test(offReply.d?.reply || ''), offReply.d?.reply?.slice(0, 40));
  await j('/admin/settings', { method: 'PUT', headers: AH, body: JSON.stringify({ bot_enabled: 'true' }) });
  await new Promise((r) => setTimeout(r, 9000));
  const onReply = await chat('hello', { session_id: 'on-1' });
  ok('bot on -> normal reply', !/unavailable/i.test(onReply.d?.reply || ''));
}

console.log(`\n========== RESULT: ${pass} passed, ${fail} failed ==========`);
process.exit(fail ? 1 : 0);
