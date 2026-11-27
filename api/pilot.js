'use strict';
const { createHash, createHmac, randomUUID, timingSafeEqual } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { get, put, BlobPreconditionFailedError } = require('@vercel/blob');
const sharp = require('sharp');
const { createRenderer, products, catalog } = require('../scripts/build-catalog.cjs');

const host = 'preview.zlunaprirody.cz';
const origin = `https://${host}`;
const renderer = createRenderer(new URL(origin));
const original = products.find(product => product.id === 'levandulova-mast');
const path = 'levandulova-mast/state.json';
const cookieName = '__Host-zlp-pilot';
const sessionSeconds = 8 * 60 * 60;
const revisionPattern = /^[a-f0-9-]{36}$/;

function send(res, status, body = '', type = 'text/plain; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.end(body);
}

function json(res, status, body) {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

function error(res, status, message) {
  return json(res, status, { error: message });
}

function sign(expiry, key) {
  return createHmac('sha256', key).update(`zlp-preview:${expiry}`).digest('hex');
}

function equalDigest(supplied, expected) {
  return /^[a-f0-9]{64}$/.test(supplied) &&
    timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
}

function hasSession(req, key) {
  const session = (req.headers.cookie || '').split(/; */).find(part => part.startsWith(`${cookieName}=`));
  const [expiry, signature] = session?.slice(cookieName.length + 1).split('.') || [];
  return /^\d{10}$/.test(expiry) && Number(expiry) > Date.now() / 1000 &&
    equalDigest(signature, sign(expiry, key));
}

function setSession(res, key) {
  const expiry = Math.floor(Date.now() / 1000) + sessionSeconds;
  const value = key ? `${expiry}.${sign(expiry, key)}` : '';
  res.setHeader('Set-Cookie', `${cookieName}=${value}; Max-Age=${key ? sessionSeconds : 0}; Path=/; Secure; HttpOnly; SameSite=Strict`);
}

async function readState(storeId) {
  const blob = await get(path, { access: 'private', storeId, useCache: false });
  if (!blob) return { state: {}, etag: null };
  if (blob.statusCode !== 200) throw new Error('Unexpected Blob response');
  return { state: await new Response(blob.stream).json(), etag: blob.blob.etag };
}

async function saveState(storeId, state, etag) {
  await put(path, JSON.stringify(state), {
    storeId, access: 'private', contentType: 'application/json', addRandomSuffix: false,
    allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
  });
}

function productFrom(record, draft = false) {
  if (!record) return original;
  const { id, price, description, ingredients, image, alt } = record;
  const photos = image ? [{
    src: draft ? `/api/pilot?view=photo&id=${encodeURIComponent(id)}` : `/pilot-media/${id}.webp`,
    alt,
  }, ...original.photos.slice(1)] : original.photos;
  return { ...original, price, description, ingredients, photos };
}

async function normalizePhoto(encoded) {
  if (typeof encoded !== 'string' || encoded.length > 1_800_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  try {
    const result = await sharp(bytes, { limitInputPixels: 1400 * 1400 })
      .autoOrient().resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 }).toBuffer();
    return result.toString('base64');
  } catch {
    return null;
  }
}

function editorState(state) {
  const record = state.draft || state.live;
  return {
    product: productFrom(record, Boolean(state.draft)), deposit: catalog.packagingDeposit(original),
    draft: state.draft?.id || null, current: record?.id || null,
  };
}

function renderPublic(view, res, state, id) {
  if (view === 'media') {
    const record = [state.live, state.previous].find(version => version?.id === id);
    if (!record?.image) return send(res, 404);
    return send(res, 200, Buffer.from(record.image, 'base64'), 'image/webp');
  }
  const product = productFrom(state.live);
  const list = products.map(item => item.id === original.id ? product : item);
  if (view === 'products') {
    return send(res, 200, `'use strict';\nconst products = ${JSON.stringify(list)};\n`, 'text/javascript; charset=utf-8');
  }
  const html = view === 'home' ? renderer.home(list.filter(item => item.published)) : renderer.product(product);
  return send(res, 200, html, 'text/html; charset=utf-8');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (req.headers.host !== host || process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'preview') return send(res, 404);
  const { searchParams } = new URL(req.url, origin);
  const view = searchParams.get('view');
  const id = searchParams.get('id');
  const storeId = process.env.ZLP_PILOT_STORE_ID;
  const key = process.env.ZLP_PILOT_ADMIN_HASH;
  const ready = Boolean(storeId) && /^[a-f0-9]{64}$/.test(key);

  try {
    if (req.method === 'GET' && ['home', 'product', 'products', 'media'].includes(view)) {
      const { state } = ready ? await readState(storeId) : { state: {} };
      return renderPublic(view, res, state, id);
    }
    if (req.method === 'GET' && view === 'admin') {
      res.setHeader('X-Robots-Tag', 'noindex');
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
      return send(res, 200, readFileSync(join(__dirname, '../admin/pilot.html')), 'text/html; charset=utf-8');
    }
    if (!ready) return error(res, 503, 'Administrace zatím není připojená k Preview.');
    if (req.method === 'POST' && (req.headers.origin !== origin ||
        req.headers['content-type']?.split(';')[0] !== 'application/json')) return send(res, 403);
    const body = req.body;
    if (req.method === 'POST' && view === 'login') {
      const password = body?.password;
      if (typeof password !== 'string' || password.length > 128 ||
          !equalDigest(createHash('sha256').update(password).digest('hex'), key)) {
        return error(res, 401, 'Nesprávné heslo.');
      }
      setSession(res, key);
      return json(res, 200, {});
    }
    if (!hasSession(req, key)) return error(res, 401, 'Přístup vyžaduje přihlášení.');
    if (req.method === 'POST' && view === 'logout') {
      setSession(res);
      return json(res, 200, {});
    }
    const { state, etag } = await readState(storeId);
    if (req.method === 'GET' && view === 'state') return json(res, 200, editorState(state));
    if (req.method === 'GET' && view === 'photo') {
      if (!revisionPattern.test(id) || state.draft?.id !== id || !state.draft.image) return send(res, 404);
      return send(res, 200, Buffer.from(state.draft.image, 'base64'), 'image/webp');
    }
    if (req.method === 'POST' && view === 'draft') {
      const { price, description, ingredients, image, alt, current } = body || {};
      const prior = state.draft || state.live;
      if (current !== (prior?.id || null)) return error(res, 409, 'Katalog se změnil. Obnovte stránku a zkontrolujte aktuální verzi.');
      const validText = value => typeof value === 'string' && value.length <= 2000 && value.trim().length > 0;
      if (!Number.isInteger(price) || price < 1 || price > 10000 || !validText(description) || !validText(ingredients) ||
          (image !== null && (typeof alt !== 'string' || !alt.trim() || alt.length > 150))) {
        return error(res, 400, 'Zkontrolujte cenu, popis, složení a formát fotografie.');
      }
      const photo = image === null ? null : await normalizePhoto(image);
      if (image !== null && !photo) return error(res, 400, 'Fotografii nelze zpracovat. Vyberte jiný snímek.');
      state.draft = { id: randomUUID(), price, description: description.trim(), ingredients: ingredients.trim(),
        image: photo || prior?.image || null, alt: photo ? alt.trim() : prior?.alt || null };
      await saveState(storeId, state, etag);
      return json(res, 200, editorState(state));
    }
    if (req.method === 'POST' && view === 'publish') {
      if (body?.id && state.live?.id === body.id && !state.draft) return json(res, 200, editorState(state));
      if (!body?.id || state.draft?.id !== body.id) return error(res, 409, 'Nejdřív otevřete náhled aktuálního konceptu.');
      state.previous = state.live || null;
      state.live = state.draft;
      state.draft = null;
      await saveState(storeId, state, etag);
      return json(res, 200, editorState(state));
    }
    return send(res, 404);
  } catch (failure) {
    if (failure instanceof BlobPreconditionFailedError || /blob already exists/i.test(failure.message)) {
      return error(res, 409, 'Katalog se mezitím změnil. Obnovte stránku.');
    }
    console.error('Pilot catalog:', failure.name);
    return error(res, 503, 'Katalogové úložiště právě není dostupné.');
  }
};
