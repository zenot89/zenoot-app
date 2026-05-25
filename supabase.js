// ─── SUPABASE.JS ─────────────────────────────────────────────
const SUPABASE_URL = 'https://hkhntwgurticesuwcmyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraG50d2d1cnRpY2VzdXdjbXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzE1NjIsImV4cCI6MjA5NDA0NzU2Mn0.DSw0s6ik7ghdl947eEROgCQ00Qc6hA-h7sl3_RihcWc';

// ─── AUTH ─────────────────────────────────────────────────────
// Anonymous signup Supabase tidak diaktifkan → selalu 422.
// Pakai anon key langsung — cukup untuk semua operasi DB yang dibutuhkan app.
// _ensureAuth() dipertahankan agar semua caller tidak perlu diubah.
async function _ensureAuth() { return null; }

function _headers(extra) {
  const h = {
    'apikey':        SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type':  'application/json'
  };
  if (extra) Object.assign(h, extra);
  return h;
}

async function _headersAsync(extra) {
  return _headers(extra);
}

// ─── DB FUNCTIONS ─────────────────────────────────────────────
async function dbGet(table, filter) {
  filter = filter || '';
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=*' + filter, {
    headers: _headers()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'GET ' + table + ' error ' + res.status);
  return Array.isArray(data) ? data : [];
}

async function dbInsert(table, payload) {
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method:  'POST',
    headers: _headers({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'INSERT ' + table + ' error ' + res.status);
  return data;
}

async function dbUpdate(table, id, payload) {
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
    method:  'PATCH',
    headers: _headers({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'UPDATE ' + table + ' error ' + res.status);
  return data;
}

async function dbDelete(table, id) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
    method:  'DELETE',
    headers: _headers()
  });
  if (!res.ok) {
    let msg = 'DELETE ' + table + ' error ' + res.status;
    try { const d = await res.json(); msg = d.message || d.hint || msg; } catch(e) {}
    throw new Error(msg);
  }
}
