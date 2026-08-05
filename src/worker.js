import { style } from './style.js';
import { publicAppJs } from './public-app.js';
import { manageAppJs } from './manage-app.js';

const STORAGE_KEY = 'notes-v3';
const ADMIN_PASSWORD = '##I##ENCRYPT##';
const COOKIE_NAME = 'dp_notes_auth';
const cookieDays = 30;
const HISTORY_LIMIT = 2;

let cachedSeedNotes = null;

async function getSeedNotes() {
  if (cachedSeedNotes) return cachedSeedNotes;
  const mod = await import('./notes.js');
  cachedSeedNotes = normalizeNotes(mod.notes);
  return cachedSeedNotes;
}

async function bootstrapNotes(env) {
  if (!env.NOTES) return;
  const shouldSeed = String(env.SEED_DEFAULT_NOTES || '').toLowerCase() === 'true';
  if (!shouldSeed) return;

  const existing = await env.NOTES.get(STORAGE_KEY);
  if (existing) return;

  const markerKey = `${STORAGE_KEY}:seeded`;
  const seededMarker = await env.NOTES.get(markerKey);
  if (seededMarker) return;

  const seedNotes = await getSeedNotes();
  await env.NOTES.put(STORAGE_KEY, JSON.stringify({ version: 1, notes: seedNotes }));
  await env.NOTES.put(markerKey, new Date().toISOString());
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'note';
}

function normalizeBlock(block = {}) {
  return {
    text: String(block.text || ''),
    copyable: !!block.copyable,
    explain: !!block.explain,
  };
}

function normalizeUsageStats(stats = {}) {
  return {
    opens: Math.max(0, Number(stats.opens || 0)),
    copies: Math.max(0, Number(stats.copies || 0)),
    lastOpenedAt: String(stats.lastOpenedAt || ''),
    lastCopiedAt: String(stats.lastCopiedAt || ''),
  };
}

function snapshotNote(note = {}) {
  return {
    id: String(note.id || ''),
    kind: String(note.kind || 'note'),
    title: String(note.title || 'Untitled'),
    index: Number(note.index || 1),
    done: !!note.done,
    blocks: Array.isArray(note.blocks) ? note.blocks.map(normalizeBlock) : [],
    stats: normalizeUsageStats(note.stats),
  };
}

function noteComparableLines(note = {}) {
  const blocks = Array.isArray(note.blocks) ? note.blocks : [];
  const lines = [
    `title: ${String(note.title || '')}`,
    `kind: ${String(note.kind || 'note')}`,
    `done: ${note.done ? 'true' : 'false'}`,
    `blocks: ${blocks.length}`,
  ];

  blocks.forEach((block, index) => {
    lines.push(`block ${index + 1}.copyable: ${block.copyable ? 'true' : 'false'}`);
    lines.push(`block ${index + 1}.explain: ${block.explain ? 'true' : 'false'}`);
    lines.push(`block ${index + 1}.text:`);
    const textLines = String(block.text || '').split(/\r?\n/);
    if (!textLines.length) {
      lines.push('');
    } else {
      lines.push(...textLines.map((line) => `  ${line}`));
    }
  });

  return lines;
}

function buildUnifiedDiff(beforeNote = {}, afterNote = {}) {
  const before = noteComparableLines(beforeNote);
  const after = noteComparableLines(afterNote);
  const rows = Array.from({ length: before.length + 1 }, () => Array(after.length + 1).fill(0));

  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      rows[i][j] = before[i] === after[j]
        ? rows[i + 1][j + 1] + 1
        : Math.max(rows[i + 1][j], rows[i][j + 1]);
    }
  }

  const out = ['--- before', '+++ after', '@@'];
  let i = 0;
  let j = 0;

  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      out.push(' ' + before[i]);
      i += 1;
      j += 1;
    } else if (rows[i + 1][j] >= rows[i][j + 1]) {
      out.push('-' + before[i]);
      i += 1;
    } else {
      out.push('+' + after[j]);
      j += 1;
    }
  }

  while (i < before.length) {
    out.push('-' + before[i]);
    i += 1;
  }

  while (j < after.length) {
    out.push('+' + after[j]);
    j += 1;
  }

  return out.join('\n');
}

function summarizeHistoryChange(beforeNote = {}, afterNote = {}, action = 'edit') {
  const bits = [];
  const beforeBlocks = Array.isArray(beforeNote.blocks) ? beforeNote.blocks : [];
  const afterBlocks = Array.isArray(afterNote.blocks) ? afterNote.blocks : [];

  if (beforeNote.title !== afterNote.title) bits.push('title');
  if (beforeNote.kind !== afterNote.kind) bits.push('type');
  if (!!beforeNote.done !== !!afterNote.done) bits.push('done');

  const blockDelta = afterBlocks.length - beforeBlocks.length;
  if (blockDelta > 0) bits.push(`+${blockDelta} block${blockDelta === 1 ? '' : 's'}`);
  if (blockDelta < 0) bits.push(`${blockDelta} block${blockDelta === -1 ? '' : 's'}`);

  const blockLimit = Math.min(beforeBlocks.length, afterBlocks.length);
  let changedBlocks = 0;
  for (let index = 0; index < blockLimit; index += 1) {
    const prev = beforeBlocks[index] || {};
    const next = afterBlocks[index] || {};
    if (
      String(prev.text || '') !== String(next.text || '') ||
      !!prev.copyable !== !!next.copyable ||
      !!prev.explain !== !!next.explain
    ) {
      changedBlocks += 1;
    }
  }

  if (changedBlocks) bits.push(`${changedBlocks} block${changedBlocks === 1 ? '' : 's'} changed`);

  const actionLabel = {
    edit: 'Before edit',
    restore: 'Before restore',
    delete: 'Before delete',
    snapshot: 'Snapshot',
  }[action] || 'Snapshot';

  const summary = bits.length ? `${actionLabel}: ${bits.join(', ')}` : `${actionLabel}: no visible content change`;
  const detail = bits.length ? bits.join(' • ') : 'No visible content change';

  return {
    action,
    summary,
    detail,
    diff: buildUnifiedDiff(beforeNote, afterNote),
  };
}



function normalizeHistoryMeta(meta = {}) {
  return {
    action: String(meta.action || 'snapshot'),
    summary: String(meta.summary || 'Snapshot saved'),
    detail: String(meta.detail || ''),
    diff: String(meta.diff || ''),
  };
}

function normalizeHistoryEntry(entry = {}) {
  const snapshot = entry.snapshot ? snapshotNote(entry.snapshot) : snapshotNote(entry);
  return {
    id: String(entry.id || crypto.randomUUID()),
    at: String(entry.at || new Date().toISOString()),
    snapshot,
    meta: normalizeHistoryMeta(entry.meta || {}),
  };
}

function normalizeNote(note = {}, index = 1) {
  const title = String(note.title || 'Untitled');
  const rawKind = String(note.kind || 'note');
  const kind = rawKind === 'warning' ? 'important' : (['note', 'ticket', 'important'].includes(rawKind) ? rawKind : 'note');
  const blocks = Array.isArray(note.blocks) && note.blocks.length ? note.blocks : [{ text: '', copyable: false, explain: false }];
  const history = Array.isArray(note.history) ? note.history.map(normalizeHistoryEntry).slice(0, HISTORY_LIMIT) : [];
  return {
    id: String(note.id || slugify(title)),
    kind,
    title,
    index: Number(note.index || index),
    done: !!note.done,
    blocks: blocks.map(normalizeBlock),
    history,
    stats: normalizeUsageStats(note.stats),
  };
}

function normalizeNotes(notes) {
  return notes.map((note, index) => normalizeNote(note, index + 1));
}

async function loadNotes(env) {
  if (!env.NOTES) return [];
  let raw = await env.NOTES.get(STORAGE_KEY);
  if (!raw) {
    await bootstrapNotes(env);
    raw = await env.NOTES.get(STORAGE_KEY);
    if (!raw) return [];
  }
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed.notes) ? parsed.notes : Array.isArray(parsed) ? parsed : [];
    return normalizeNotes(list);
  } catch {
    return [];
  }
}

async function saveNotes(env, notes) {
  const normalized = normalizeNotes(notes);
  if (env.NOTES) {
    await env.NOTES.put(STORAGE_KEY, JSON.stringify({ version: 1, notes: normalized }));
  }
  return normalized;
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const target = name + '=';
  for (const part of cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return decodeURIComponent(trimmed.slice(target.length));
  }
  return '';
}

function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest('SHA-256', data).then((buf) =>
    [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  );
}

const AUTH_TOKEN = await sha256Hex(ADMIN_PASSWORD);

function isAuthed(request) {
  return getCookie(request, COOKIE_NAME) === AUTH_TOKEN;
}

function authHeaders(value) {
  return {
    'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * cookieDays}`,
  };
}

function clearAuthHeaders() {
  return {
    'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  };
}

function response(text, status = 200, headers = {}) {
  return new Response(text, {
    status,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\u003c');
}

function backupPayload(notes) {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    notes: sortByIndex(notes),
  };
}

function publicShell(embedNotes = null) {
  const embedded = Array.isArray(embedNotes) ? `
  <script>window.__EMBEDDED_NOTES__ = ${safeScriptJson(embedNotes)};</script>` : '';
  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="data:,">
  <title>My Notes</title>
  <style>${style}</style>
</head>
<body>
  <main>
    <section class="topBar" dir="ltr">
      <input id="searchBox" type="search" placeholder="Search notes, tickets, text..." autocomplete="off" spellcheck="false">
      <select id="statusFilter" aria-label="Filter cards">
        <option value="all">All</option>
        <option value="active">Active only</option>
        <option value="done">Done only</option>
      </select>
      <span class="meta" id="cardCount">Loading...</span>
    </section>
    <section id="notes" class="container" aria-live="polite" dir="auto"></section>
  </main>
  <div id="toast" style="visibility:hidden; opacity:0;"></div>${embedded}
  <script type="module">${publicAppJs}</script>
</body>
</html>`;
}

function manageLoginShell(message = '') {
  const error = message ? `<p class="manageHint" style="color:#ffb4b4">${escapeHtml(message)}</p>` : '';
  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="data:,">
  <title>Access</title>
  <style>${style}</style>
</head>
<body>
  <main class="authWrap" dir="ltr">
    <section class="authCard" dir="ltr">
      <h1>Access</h1>
      <form class="authForm" method="post" action="/manage/login">
        <input name="passphrase" type="password" placeholder="Passphrase" autocomplete="current-password" required>
        <button type="submit">Enter</button>
      </form>
      ${error}
    </section>
  </main>
</body>
</html>`;
}

function manageShell() {
  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="data:,">
  <title>Manage</title>
  <style>${style}</style>
</head>
<body>
  <main>
    <div id="app" dir="ltr"></div>
  </main>
  <div id="toast" style="visibility:hidden; opacity:0;"></div>
  <script type="module">${manageAppJs}</script>
</body>
</html>`;
}


async function parseBackupPayload(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file') || form.get('backup') || form.get('data');
    if (file && typeof file.text === 'function') {
      return JSON.parse(await file.text());
    }
    const raw = form.get('json') || form.get('payload');
    if (typeof raw === 'string' && raw.trim()) {
      return JSON.parse(raw);
    }
    return {};
  }
  return await parseBody(request);
}

async function replaceAllNotes(env, payload) {
  const notes = Array.isArray(payload?.notes)
    ? payload.notes
    : Array.isArray(payload) ? payload : [];
  const normalized = await saveNotes(env, notes);
  return normalized;
}

function exportHtmlAttachment(notes) {
  return response(publicShell(notes), 200, {
    'content-disposition': 'attachment; filename="my-notes-offline.html"',
  });
}

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
}

async function parseBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}));
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
}

function uniqueId(notes, title) {
  const base = slugify(title);
  const existing = new Set(notes.map((note) => note.id));
  let i = 1;
  let id = base;
  while (existing.has(id)) {
    id = `${base}-${i++}`;
  }
  return id;
}

function sortByIndex(notes) {
  return [...notes].sort((a, b) => (a.index || 0) - (b.index || 0));
}

async function createNote(env, body) {
  const notes = await loadNotes(env);
  const title = String(body.title || '').trim();
  if (!title) throw new Error('Title is required');
  const note = normalizeNote({
    id: uniqueId(notes, title),
    title,
    kind: body.kind,
    done: !!body.done,
    blocks: Array.isArray(body.blocks) ? body.blocks : [],
    history: [],
    index: notes.length + 1,
  }, notes.length + 1);
  const updated = sortByIndex([...notes, note]).map((n, i) => ({ ...n, index: i + 1 }));
  await saveNotes(env, updated);
  return note;
}


function pushHistory(note, next = null, action = 'edit') {
  const history = Array.isArray(note.history) ? note.history : [];
  return [
    normalizeHistoryEntry({
      snapshot: snapshotNote(note),
      meta: summarizeHistoryChange(note, next || note, action),
    }),
    ...history,
  ].slice(0, HISTORY_LIMIT);
}


async function updateNote(env, id, body) {
  const notes = await loadNotes(env);
  const index = notes.findIndex((note) => note.id === id);
  if (index < 0) throw new Error('Note not found');
  const current = notes[index];
  const next = normalizeNote({
    ...current,
    title: body.title ?? current.title,
    kind: body.kind ?? current.kind,
    done: typeof body.done === 'boolean' ? body.done : current.done,
    blocks: Array.isArray(body.blocks) ? body.blocks : current.blocks,
    id: current.id,
    index: current.index,
    history: [],
  }, current.index);
  next.history = pushHistory(current, next, 'edit');
  notes[index] = next;
  await saveNotes(env, notes);
  return next;
}


async function restoreNote(env, body) {
  const snapshot = snapshotNote(body.note || body);
  const notes = await loadNotes(env);
  const index = notes.findIndex((note) => note.id === snapshot.id);

  if (index >= 0) {
    const current = notes[index];
    const restored = normalizeNote({
      ...snapshot,
      id: current.id,
      index: current.index,
      history: [],
    }, current.index);
    restored.history = pushHistory(current, restored, 'restore');
    notes[index] = restored;
    await saveNotes(env, notes);
    return restored;
  }

  const restored = normalizeNote({
    ...snapshot,
    index: Number(snapshot.index || notes.length + 1),
    history: [],
  }, Number(snapshot.index || notes.length + 1));
  const updated = sortByIndex([...notes, restored]).map((n, i) => ({ ...n, index: i + 1 }));
  await saveNotes(env, updated);
  return restored;
}


async function deleteHistory(env, id, body) {
  const notes = await loadNotes(env);
  const index = notes.findIndex((note) => note.id === id);
  if (index < 0) throw new Error('Note not found');

  const current = notes[index];
  let history = Array.isArray(current.history) ? current.history : [];

  if (body && body.all) {
    history = [];
  } else if (body && body.historyId) {
    const before = history.length;
    history = history.filter((entry) => entry.id !== String(body.historyId));
    if (history.length === before) throw new Error('Snapshot not found');
  } else {
    throw new Error('Snapshot id is required');
  }

  notes[index] = normalizeNote({
    ...current,
    history,
  }, current.index);
  await saveNotes(env, notes);
  return notes[index];
}

async function recordUsage(env, id, body = {}) {
  const notes = await loadNotes(env);
  const index = notes.findIndex((note) => note.id === id);
  if (index < 0) throw new Error('Note not found');

  const current = notes[index];
  const stats = normalizeUsageStats(current.stats);
  const action = String(body.action || body.event || '').trim().toLowerCase();
  const now = new Date().toISOString();

  if (action === 'open' || action === 'view') {
    stats.opens += 1;
    stats.lastOpenedAt = now;
  } else if (action === 'copy') {
    stats.copies += 1;
    stats.lastCopiedAt = now;
  } else {
    throw new Error('Usage action is required');
  }

  notes[index] = normalizeNote({
    ...current,
    stats,
  }, current.index);
  await saveNotes(env, notes);
  return notes[index];
}

async function deleteNote(env, id) {
  const notes = await loadNotes(env);
  const filtered = notes.filter((note) => note.id !== id);
  if (filtered.length === notes.length) throw new Error('Note not found');
  const renumbered = sortByIndex(filtered).map((note, index) => ({ ...note, index: index + 1 }));
  await saveNotes(env, renumbered);
  return true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/favicon.ico') {
      return new Response('', { status: 204 });
    }

    if (pathname === '/') {
      return response(publicShell());
    }

    if (pathname === '/app.js') {
      return new Response(publicAppJs, {
        headers: {
          'content-type': 'text/javascript; charset=UTF-8',
          'cache-control': 'no-store',
        },
      });
    }

    if (pathname === '/api/notes' && request.method === 'GET') {
      const notes = sortByIndex(await loadNotes(env));
      return json({ notes });
    }

    if (pathname === '/manage/export.json' && request.method === 'GET') {
      if (!isAuthed(request)) return response(manageLoginShell(), 401);
      const notes = sortByIndex(await loadNotes(env));
      return json(backupPayload(notes), 200, {
        'content-disposition': 'attachment; filename="my-notes-backup.json"',
      });
    }

    if (pathname === '/manage/export.html' && request.method === 'GET') {
      if (!isAuthed(request)) return response(manageLoginShell(), 401);
      const notes = sortByIndex(await loadNotes(env));
      return exportHtmlAttachment(notes);
    }

    if (pathname === '/manage/import' && request.method === 'POST') {
      if (!isAuthed(request)) return json({ error: 'Unauthorized' }, 401);
      try {
        const payload = await parseBackupPayload(request);
        const normalized = await replaceAllNotes(env, payload);
        return json({ ok: true, notes: normalized });
      } catch (error) {
        return json({ error: error.message || 'Failed to import backup' }, 400);
      }
    }

    if (pathname === '/manage') {
      if (request.method === 'GET') {
        return isAuthed(request) ? response(manageShell()) : response(manageLoginShell());
      }
    }

    if (pathname === '/manage/login' && request.method === 'POST') {
      const body = await parseBody(request);
      if (String(body.passphrase || '') !== ADMIN_PASSWORD) {
        return response(manageLoginShell('Wrong passphrase'), 401);
      }
      return response('', 302, {
        ...authHeaders(AUTH_TOKEN),
        Location: '/manage',
      });
    }

    if (pathname === '/api/logout' && request.method === 'POST') {
      return json({ ok: true }, 200, clearAuthHeaders());
    }

    if (!isAuthed(request) && pathname.startsWith('/api/') && request.method !== 'GET' && !pathname.endsWith('/usage')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (pathname === '/api/notes' && request.method === 'POST') {
      try {
        const body = await parseBody(request);
        const note = await createNote(env, body);
        return json({ note }, 201);
      } catch (error) {
        return json({ error: error.message || 'Failed to create note' }, 400);
      }
    }

    if (pathname === '/api/notes/restore' && request.method === 'POST') {
      try {
        const body = await parseBody(request);
        const note = await restoreNote(env, body);
        return json({ note });
      } catch (error) {
        return json({ error: error.message || 'Failed to restore note' }, 400);
      }
    }

    if (pathname.startsWith('/api/notes/') && pathname.endsWith('/usage') && request.method === 'POST') {
      try {
        const id = decodeURIComponent(pathname.split('/')[3]);
        const body = await parseBody(request);
        const note = await recordUsage(env, id, body);
        return json({ note });
      } catch (error) {
        return json({ error: error.message || 'Failed to record usage' }, 400);
      }
    }

    if (pathname.startsWith('/api/notes/') && pathname.endsWith('/history') && request.method === 'POST') {
      try {
        const id = decodeURIComponent(pathname.split('/')[3]);
        const body = await parseBody(request);
        const note = await deleteHistory(env, id, body);
        return json({ note });
      } catch (error) {
        return json({ error: error.message || 'Failed to update history' }, 400);
      }
    }

    if (pathname.startsWith('/api/notes/') && request.method === 'PUT') {
      try {
        const id = decodeURIComponent(pathname.split('/').pop());
        const body = await parseBody(request);
        const note = await updateNote(env, id, body);
        return json({ note });
      } catch (error) {
        return json({ error: error.message || 'Failed to update note' }, 400);
      }
    }

    if (pathname.startsWith('/api/notes/') && request.method === 'DELETE') {
      try {
        const id = decodeURIComponent(pathname.split('/').pop());
        await deleteNote(env, id);
        return json({ ok: true });
      } catch (error) {
        return json({ error: error.message || 'Failed to delete note' }, 400);
      }
    }

    if (pathname === '/manage.js') {
      return new Response(manageAppJs, {
        headers: {
          'content-type': 'text/javascript; charset=UTF-8',
          'cache-control': 'no-store',
        },
      });
    }

    if (pathname === '/manage' && request.method === 'GET' && isAuthed(request)) {
      return response(manageShell());
    }

    return notFound();
  },
};
