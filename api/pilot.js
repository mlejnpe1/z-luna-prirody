'use strict';
const { createHash, createHmac, randomUUID, timingSafeEqual } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } = require('@vercel/blob');
const sharp = require('sharp');
const { createRenderer, products, catalog, config } = require('../scripts/build-catalog.cjs');

const host = 'preview.zlunaprirody.cz';
const origin = `https://${host}`;
const renderer = createRenderer(new URL(origin));
const productById = new Map(products.map(product => [product.id, product]));
const categories = [...new Set(products.map(product => product.category))];
const volumes = Object.keys(config.packagingDeposits);
const careChoices = [
  { value: 'skin', label: 'Pokožka', art: 'lavender' },
  { value: 'body', label: 'Tělo', art: 'butter' },
  { value: 'hair', label: 'Vlasy', art: 'oil' },
  { value: 'lips-nails', label: 'Rty a nehty', art: 'lips' },
];
const pilotProductId = 'levandulova-mast';
const statePath = `${pilotProductId}/state.json`;
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

async function readState(storeId, forWrite = false) {
  // The storage API provides the write ETag. A cache-bypassing download
  // can omit it, so take the write precondition before reading the state.
  let etag = null;
  if (forWrite) {
    try {
      etag = (await head(statePath, { storeId })).etag;
    } catch (failure) {
      if (!(failure instanceof BlobNotFoundError)) throw failure;
    }
  }
  const blob = await get(statePath, { access: 'private', storeId, useCache: false });
  if (forWrite && Boolean(blob) !== Boolean(etag)) throw new BlobPreconditionFailedError();
  if (!blob) return { states: Object.create(null), etag: null };
  if (blob.statusCode !== 200) throw new Error('Unexpected Blob response');
  const stored = await new Response(blob.stream).json();
  // The original pilot stored one product directly at this same pathname.
  const states = Object.assign(Object.create(null), stored.products ?? { [pilotProductId]: stored });
  return { states, etag };
}

function photoPath(productId, photo) {
  return `catalog-photos/${productId}/${photo}.webp`;
}

function alreadyExists(error) {
  return /blob already exists/i.test(error.message);
}

async function storePhoto(storeId, productId, bytes) {
  const photo = createHash('sha256').update(bytes).digest('hex');
  try {
    await put(photoPath(productId, photo), bytes, {
      storeId, access: 'private', contentType: 'image/webp', addRandomSuffix: false, allowOverwrite: false,
    });
  } catch (failure) {
    if (!alreadyExists(failure)) throw failure;
  }
  return photo;
}

async function saveState(storeId, states, etag) {
  const pilot = states[pilotProductId];
  // Keep the existing draft, live and previous revisions, including their
  // URLs, while moving their inline images out of the frequently read state.
  for (const record of [pilot?.draft, pilot?.live, pilot?.previous]) {
    if (!record?.image) continue;
    record.photo = await storePhoto(storeId, pilotProductId, Buffer.from(record.image, 'base64'));
    delete record.image;
  }
  await put(statePath, JSON.stringify({ products: states }), {
    storeId, access: 'private', contentType: 'application/json', addRandomSuffix: false,
    allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
  });
}

function productFrom(original, record, draft = false) {
  if (!record) return original;
  const { id, price, description, ingredients, photo, image, alt, details } = record;
  const originals = original.photos || [];
  const photos = photo || image ? [{
    src: draft ? `/api/pilot?view=photo&product=${original.id}&id=${id}` : `/pilot-media/${id}.webp`,
    alt,
  }, ...originals.slice(1)] : originals;
  return { ...original, ...details, price, description, ingredients, photos };
}

function validText(value, limit) {
  return typeof value === 'string' && value.length <= limit && value.trim().length > 0;
}

function productDetails(input) {
  const { name, category, volume, care, scentChoice } = input || {};
  const choice = careChoices.find(item => item.value === care);
  if (!validText(name, 80) || !categories.includes(category) || !volumes.includes(volume) ||
      !choice || typeof scentChoice !== 'boolean') return null;
  return { name: name.trim(), category, volume, care, scentChoice, art: choice.art };
}

function productSlug(name) {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function newProduct(id) {
  return { id, published: true, photos: [] };
}

function hasPublishedVersion(id, state) {
  if (state?.deleted) return false;
  return productById.get(id)?.published ?? Boolean(state?.live?.details);
}

function isVisible(id, state) {
  return hasPublishedVersion(id, state) && !state?.hidden;
}

async function normalizePhoto(encoded) {
  if (typeof encoded !== 'string' || encoded.length > 1_800_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  try {
    return await sharp(bytes, { limitInputPixels: 1400 * 1400 })
      .autoOrient().resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 }).toBuffer();
  } catch {
    return null;
  }
}

function editorState(original, states) {
  const options = products.filter(({ id }) => !states[id]?.deleted)
    .map(({ id, name }) => ({ id, name, hidden: Boolean(states[id]?.hidden) }));
  for (const [id, entry] of Object.entries(states)) {
    if (productById.has(id) || entry.deleted) continue;
    const details = (entry.draft || entry.live)?.details;
    if (details) options.push({ id, name: details.name, draftOnly: !entry.live, hidden: Boolean(entry.hidden) });
  }
  if (!original && options.length) {
    const [{ id }] = options;
    original = productById.get(id) || newProduct(id);
  }
  const state = states[original?.id] ?? {};
  const record = state.draft || state.live;
  const product = original ? productFrom(original, record, Boolean(state.draft)) : null;
  return {
    products: options, product, editableDetails: Boolean(original) && !productById.has(original.id),
    choices: { categories, volumes, care: careChoices },
    deposit: product ? catalog.packagingDeposit(product) : null,
    draft: state.draft?.id || null, current: record?.id || null,
    hasPublished: hasPublishedVersion(original?.id, state), hidden: Boolean(state.hidden),
  };
}

async function sendPhoto(res, storeId, productId, record) {
  if (record?.image) return send(res, 200, Buffer.from(record.image, 'base64'), 'image/webp');
  if (!record?.photo || !/^[a-f0-9]{64}$/.test(record.photo)) return send(res, 404);
  const blob = await get(photoPath(productId, record.photo), { access: 'private', storeId });
  if (!blob || blob.statusCode !== 200) return send(res, 404);
  return send(res, 200, Buffer.from(await new Response(blob.stream).arrayBuffer()), 'image/webp');
}

function renderPublic(view, res, storeId, states, productId, id) {
  if (view === 'media') {
    if (!revisionPattern.test(id)) return send(res, 404);
    for (const [itemId, state] of Object.entries(states)) {
      if (!isVisible(itemId, state)) continue;
      const record = [state?.live, state?.previous].find(version => version?.id === id);
      if (record) return sendPhoto(res, storeId, itemId, record);
    }
    return send(res, 404);
  }
  if (view === 'product') {
    const state = states[productId];
    if (!isVisible(productId, state)) return send(res, 404);
    const original = productById.get(productId) || newProduct(productId);
    return send(res, 200, renderer.product(productFrom(original, state?.live)), 'text/html; charset=utf-8');
  }
  const list = products.filter(item => isVisible(item.id, states[item.id]))
    .map(item => productFrom(item, states[item.id]?.live));
  for (const [itemId, state] of Object.entries(states)) {
    if (!productById.has(itemId) && isVisible(itemId, state)) list.push(productFrom(newProduct(itemId), state.live));
  }
  if (view === 'products') {
    return send(res, 200, `'use strict';\nconst products = ${JSON.stringify(list)};\n`, 'text/javascript; charset=utf-8');
  }
  if (view === 'sitemap') return send(res, 200, renderer.sitemap(list), 'application/xml; charset=utf-8');
  return send(res, 200, renderer.home(list), 'text/html; charset=utf-8');
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
  let productId = searchParams.get('product') ?? pilotProductId;
  const storeId = process.env.ZLP_PILOT_STORE_ID;
  const key = process.env.ZLP_PILOT_ADMIN_HASH;
  const ready = Boolean(storeId) && /^[a-f0-9]{64}$/.test(key);

  try {
    if (req.method === 'GET' && ['home', 'product', 'products', 'media', 'sitemap'].includes(view)) {
      const { states } = ready ? await readState(storeId) : { states: Object.create(null) };
      return await renderPublic(view, res, storeId, states, productId, id);
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
    const { states, etag } = await readState(storeId, req.method === 'POST');
    if (req.method === 'GET' && view === 'state' && !searchParams.has('product')) {
      return json(res, 200, editorState(null, states));
    }
    const creating = req.method === 'POST' && view === 'create';
    const editingDraft = req.method === 'POST' && (view === 'draft' || creating);
    const details = editingDraft && (creating || !productById.has(productId)) ? productDetails(body) : null;
    if (creating) {
      if (!details) return error(res, 400, 'Vyplňte název, kategorii, péči a objem.');
      productId = productSlug(details.name);
      if (!productId) return error(res, 400, 'Název musí obsahovat písmeno nebo číslici pro adresu produktu.');
      if (productById.has(productId) || Object.hasOwn(states, productId)) {
        return error(res, 409, 'Produkt s touto adresou už existuje. Zvolte odlišný název.');
      }
    }
    const original = productById.get(productId) || ((creating || Object.hasOwn(states, productId)) && newProduct(productId));
    const state = states[productId] ?? {};
    if (!original || state.deleted) return error(res, 404, 'Produkt nebyl nalezen.');
    if (req.method === 'GET' && view === 'state') return json(res, 200, editorState(original, states));
    if (req.method === 'GET' && view === 'photo') {
      if (!revisionPattern.test(id) || state.draft?.id !== id) return send(res, 404);
      return await sendPhoto(res, storeId, original.id, state.draft);
    }
    if (req.method === 'POST' && view === 'visibility') {
      if (typeof body?.hidden !== 'boolean') return error(res, 400, 'Zadejte viditelnost produktu.');
      if (!hasPublishedVersion(productId, state)) return error(res, 409, 'Produkt zatím nemá zveřejněnou verzi.');
      if (body.current !== ((state.draft || state.live)?.id || null)) {
        return error(res, 409, 'Produkt se změnil. Obnovte stránku a zkontrolujte aktuální verzi.');
      }
      if (Boolean(state.hidden) === body.hidden) return json(res, 200, editorState(original, states));
      state.hidden = body.hidden;
      states[productId] = state;
      await saveState(storeId, states, etag);
      return json(res, 200, editorState(original, states));
    }
    if (req.method === 'POST' && view === 'discard') {
      if (!body?.id || state.draft?.id !== body.id) return error(res, 409, 'Koncept se změnil nebo už byl odstraněn.');
      delete state.draft;
      const neverPublished = !productById.has(productId) && !state.live;
      if (neverPublished) delete states[productId];
      await saveState(storeId, states, etag);
      return json(res, 200, editorState(neverPublished ? null : original, states));
    }
    if (req.method === 'POST' && view === 'delete-product') {
      if (!hasPublishedVersion(productId, state)) return error(res, 409, 'Nezveřejněný produkt odstraníte smazáním konceptu.');
      if (body?.current !== ((state.draft || state.live)?.id || null)) {
        return error(res, 409, 'Produkt se změnil. Obnovte stránku a zkontrolujte aktuální verzi.');
      }
      // Retire the slug so old links and carts cannot point at a different product.
      states[productId] = { deleted: true };
      await saveState(storeId, states, etag);
      return json(res, 200, editorState(null, states));
    }
    if (editingDraft) {
      const { price, description, ingredients, image, alt, current } = body || {};
      const prior = state.draft || state.live;
      if (current !== (prior?.id || null)) return error(res, 409, 'Katalog se změnil. Obnovte stránku a zkontrolujte aktuální verzi.');
      if (!productById.has(productId) && !details) return error(res, 400, 'Vyplňte název, kategorii, péči a objem.');
      if (!Number.isInteger(price) || price < 1 || price > 10000 || !validText(description, 2000) ||
          !validText(ingredients, 2000) || (image !== null && !validText(alt, 150))) {
        return error(res, 400, 'Zkontrolujte cenu, popis, složení a formát fotografie.');
      }
      const bytes = image === null ? null : await normalizePhoto(image);
      if (image !== null && !bytes) return error(res, 400, 'Fotografii nelze zpracovat. Vyberte jiný snímek.');
      const photo = bytes ? await storePhoto(storeId, original.id, bytes) : prior?.photo || null;
      state.draft = { id: randomUUID(), price, description: description.trim(), ingredients: ingredients.trim(),
        photo, image: bytes ? null : prior?.image || null, alt: bytes ? alt.trim() : prior?.alt || null,
        ...(details && { details }),
      };
      states[original.id] = state;
      await saveState(storeId, states, etag);
      return json(res, 200, editorState(original, states));
    }
    if (req.method === 'POST' && view === 'publish') {
      if (body?.id && state.live?.id === body.id && !state.draft) return json(res, 200, editorState(original, states));
      if (!body?.id || state.draft?.id !== body.id) return error(res, 409, 'Nejdřív otevřete náhled aktuálního konceptu.');
      state.previous = state.live || null;
      state.live = state.draft;
      state.draft = null;
      await saveState(storeId, states, etag);
      return json(res, 200, editorState(original, states));
    }
    return send(res, 404);
  } catch (failure) {
    if (failure instanceof BlobPreconditionFailedError || alreadyExists(failure)) {
      return error(res, 409, 'Katalog se mezitím změnil. Obnovte stránku.');
    }
    console.error('Pilot catalog:', failure.name);
    return error(res, 503, 'Katalogové úložiště právě není dostupné.');
  }
};
