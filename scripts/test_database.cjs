// Test actual PostgreSQL functions in an isolated in-memory PGlite database.
let PGlite;
try { ({ PGlite } = require('../.tools/node_modules/@electric-sql/pglite')); }
catch { ({ PGlite } = require('../.tools/pglite/package/dist/index.cjs')); }
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const db = new PGlite();
  const root = join(__dirname, '..');
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
  await db.exec(readFileSync(join(root, 'backend/schema.sql'), 'utf8'));
  await db.exec(readFileSync(join(root, 'data/guests-seed.sql'), 'utf8'));
  const records = (await db.query('SELECT * FROM public.wedding_guests ORDER BY name')).rows;
  assert.equal(records.length, 800);
  const guest = records[0];
  console.log('PASS: schema and all 800 seed records execute in PostgreSQL');
  await db.exec('SET ROLE anon');
  const query = async (sql, values) => (await db.query(sql, values)).rows;
  await assert.rejects(() => query('SELECT * FROM public.wedding_guests'), /permission denied/);
  await assert.rejects(() => query('SELECT * FROM public.wedding_responses'), /permission denied/);
  await assert.rejects(() => query('UPDATE public.wedding_guests SET name = $1', ['Tampered']), /permission denied/);
  const named = (await query('SELECT public.wedding_guest($1) AS guest', [guest.token]))[0].guest;
  assert.deepEqual(named, { name: guest.name, max_party: guest.max_party });
  assert.equal((await query('SELECT public.wedding_guest($1) AS guest', ['0'.repeat(32)]))[0].guest, null);
  console.log('PASS: direct guest/response reads and writes denied, valid token resolves only its guest');
  const submit = (token, message, attendance, party, consent = true) => query('SELECT public.wedding_respond($1,$2,$3,$4,$5) AS response', [token, message, attendance, party, consent]);
  await assert.rejects(() => submit('0'.repeat(32), 'Hello', 'hadir', 1), /Invalid invitation/);
  for (const args of [
    [guest.token, 'Hello', 'hadir', guest.max_party + 1],
    [guest.token, 'Hello', 'hadir', 0],
    [guest.token, 'Hello', 'tidak', 1],
    [guest.token, 'Hello', 'invalid', 0],
    [guest.token, ' ', 'hadir', 1],
    [guest.token, 'x'.repeat(1001), 'hadir', 1],
    [guest.token, 'Hello', 'hadir', 1, false],
    [guest.token, null, 'hadir', 1],
    [guest.token, 'Hello', null, 1],
    [guest.token, 'Hello', 'hadir', null]
  ]) await assert.rejects(() => submit(...args), /Invalid response/);
  console.log('PASS: server validates token, attendance, party size, text length, nulls, and consent');
  assert.equal((await submit(guest.token, 'Selamat berbahagia!', 'hadir', 2))[0].response.ok, true);
  await assert.rejects(() => submit(guest.token, 'Again', 'hadir', 1), /Please wait/);
  assert.deepEqual((await query('SELECT public.wedding_wishes($1) AS wishes', [guest.token]))[0].wishes, []);
  await db.exec('RESET ROLE');
  await db.query('UPDATE public.wedding_responses SET approved = true WHERE guest_token = $1', [guest.token]);
  await db.exec('SET ROLE anon');
  const wishes = (await query('SELECT public.wedding_wishes($1) AS wishes', [guest.token]))[0].wishes;
  assert.equal(wishes.length, 1);
  assert.deepEqual(Object.keys(wishes[0]).sort(), ['created_at', 'message', 'name']);
  assert.equal(wishes[0].message, 'Selamat berbahagia!');
  assert.deepEqual((await query('SELECT public.wedding_wishes($1) AS wishes', ['0'.repeat(32)]))[0].wishes, []);
  console.log('PASS: rate limit, moderation, guest-only wishes, no RSVP or token exposed');
  await db.exec("RESET ROLE; UPDATE public.wedding_responses SET updated_at = now() - interval '20 seconds'; SET ROLE anon;");
  await submit(guest.token, 'Mohon maaf, belum bisa hadir.', 'tidak', 0);
  await db.exec('RESET ROLE');
  const saved = (await db.query('SELECT * FROM public.wedding_responses')).rows;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].attendance, 'tidak');
  assert.equal(saved[0].party, 0);
  assert.equal(saved[0].approved, false);
  await db.query('UPDATE public.wedding_guests SET active = false WHERE token = $1', [guest.token]);
  await db.exec('SET ROLE anon');
  assert.equal((await query('SELECT public.wedding_guest($1) AS guest', [guest.token]))[0].guest, null);
  await assert.rejects(() => submit(guest.token, 'No access', 'tidak', 0), /Invalid invitation/);
  await db.exec('RESET ROLE');
  await db.exec(readFileSync(join(root, 'backend/schema.sql'), 'utf8'));
  await db.exec(readFileSync(join(root, 'data/guests-seed.sql'), 'utf8'));
  assert.equal((await db.query('SELECT count(*)::int AS count FROM public.wedding_responses')).rows[0].count, 1);
  console.log('PASS: updates do not duplicate, edits require moderation, revoked tokens fail, reruns preserve responses');
  await db.close();
  console.log('ALL DATABASE CHECKS PASSED. Hosted Supabase deployment still requires configuration.');
})().catch(error => { console.error(error); process.exitCode = 1; });
