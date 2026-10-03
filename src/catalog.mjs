/* SPDX-License-Identifier: GPL-3.0-or-later */
export function publicUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return null;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') ? u.href : null; } catch { return null; }
}
export function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim(); }
export function validateIndex(data) {
  if (data?.schema !== 1 || !Array.isArray(data.entries) || data.entries.length > 20000 || !data.summary) throw new Error('Catalogue invalide');
  const ids = new Set();
  for (const e of data.entries) {
    if (!e || !/^[a-z0-9-]{1,80}$/.test(e.id) || ids.has(e.id) || !['recipe','product'].includes(e.kind) || typeof e.name !== 'string' || e.name.length > 500 || !/^data\/(products|recipes-\d{3})\.json$/.test(e.file) || !['fr','en'].includes(e.language) || !Array.isArray(e.tags) || e.tags.some(t => typeof t !== 'string' || t.length > 300)) throw new Error('Entrée de catalogue invalide');
    ids.add(e.id);
  }
  return data;
}
const normalizedEntries = new WeakMap();
export function search(entries, { query = '', kind = '', language = '', origin = '', full = false } = {}) {
  const words = normalize(query).slice(0, 300).split(/\s+/).filter(Boolean);
  return entries.filter(e => {
    if ((kind && e.kind !== kind) || (language && e.language !== language) || (origin && e.origin !== origin) || (full && e.availability !== 'text')) return false;
    if (!normalizedEntries.has(e)) normalizedEntries.set(e, normalize(e.name + ' ' + e.tags.join(' ') + ' ' + String(e.search_terms || '').slice(0,30000)));
    return words.every(word => normalizedEntries.get(e).includes(word));
  });
}
export async function boundedJson(url, {fetchImpl = fetch, maxBytes = 8 * 1024 * 1024} = {}) {
  const response = await fetchImpl(url, { credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Catalogue indisponible (' + response.status + ')');
  if (Number(response.headers.get('Content-Length')) > maxBytes) throw new Error('Fichier trop volumineux');
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    for (;;) { const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) throw new Error('Fichier trop volumineux'); chunks.push(value); }
  } catch (e) { await reader.cancel(); throw e; }
  const data = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(data));
}
export function validateRecord(record, entry) {
  if (record?.id !== entry.id || record.kind !== entry.kind || record.name !== entry.name || !Array.isArray(record.kind === 'recipe' ? record.ingredients : record.barcodes)) throw new Error('Fiche incohérente');
  return record;
}
