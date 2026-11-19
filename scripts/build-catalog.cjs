'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const output = path.join(root, 'dist');
const context = vm.createContext({});
for (const file of ['site-config.js', 'products.js', 'catalog.js']) {
  vm.runInContext(fs.readFileSync(path.join(source, file), 'utf8'), context);
}
const { config, products, catalog } = vm.runInContext('({config:siteConfig,products,catalog:Catalog})', context);
const esc = catalog.escape;
const previewHost = process.env.VERCEL_ENV === 'preview' && (process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL);
const base = new URL(previewHost ? `https://${previewHost}/` : config.siteUrl);
if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
  throw new Error('siteConfig.siteUrl musí být veřejná HTTPS adresa kořene webu, bez dalších parametrů.');
}
const published = products.filter(p => p.published);
const { scents, packagingDeposits } = config;
const showPrivacyDraft = !process.env.VERCEL && !process.env.VERCEL_ENV && process.argv.includes('--privacy-draft');
const privacyDraft = showPrivacyDraft
  ? fs.readFileSync(path.join(root, '.private', 'privacy-draft', 'public', 'ochrana-osobnich-udaju.html'), 'utf8')
  : '';
const ids = new Set();
for (const p of published) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) || ids.has(p.id)) throw new Error('Neplatné nebo duplicitní ID produktu.');
  ids.add(p.id);
  if (!Number.isInteger(catalog.packagingDeposit(p)) || catalog.packagingDeposit(p) <= 0) {
    throw new Error(`${p.id}: chybí platná záloha za obal ${p.volume}.`);
  }
  if (p.photos !== undefined && !Array.isArray(p.photos)) throw new Error(`${p.id}: photos musí být pole.`);
  for (const photo of catalog.photos(p)) {
    if (!photo || typeof photo.alt !== 'string' || !photo.alt.trim()) throw new Error(`${p.id}: každá fotografie potřebuje popis alt.`);
    for (const file of [photo.src, ...(photo.thumbnail ? [photo.thumbnail] : [])]) {
      if (typeof file !== 'string' || !/^\/assets\/products\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:jpe?g|png|webp|avif)$/i.test(file)) {
        throw new Error(`${p.id}: fotografie musí mít cestu /assets/products/nazev.jpg (také png, webp nebo avif).`);
      }
      const location = path.join(source, file);
      if (!fs.existsSync(location) || !fs.statSync(location).isFile()) throw new Error(`${p.id}: chybí fotografie ${file}.`);
    }
    if (photo.caption !== undefined && typeof photo.caption !== 'string') throw new Error(`${p.id}: popisek caption musí být text.`);
  }
}
// Odstraňuje pouze vlastní výstup buildu; nikdy zdrojový projekt nebo odkaz mimo něj.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Neplatný výstup.');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('dist nesmí být symbolický odkaz.');
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true, filter: file => path.basename(file) !== 'ochrana-osobnich-udaju.html' });

function head(title, description, pagePath, noindex = false, sharePhoto = null) {
  const canonical = new URL(pagePath, base).href;
  const image = new URL(sharePhoto ? sharePhoto.src : '/assets/social-card.png', base).href;
  const imageType = sharePhoto ? ({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif'}[path.extname(sharePhoto.src).toLowerCase()]) : 'image/png';
  const imageAlt = sharePhoto ? sharePhoto.alt : 'Z lůna přírody — ručně vyráběné bylinné masti a kosmetika. Logo značky a ilustrace levandule.';
  return `<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#203f35">
  ${noindex ? '<meta name="robots" content="noindex">' : ''}
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" type="image/png" href="/favicon-96.png" sizes="96x96">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:site_name" content="Z lůna přírody">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:type" content="${imageType}">
  ${sharePhoto ? '' : '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'}
  <meta property="og:image:alt" content="${esc(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(image)}">
  <meta name="twitter:image:alt" content="${esc(imageAlt)}">
  <link rel="stylesheet" href="/style.css">
</head>`;
}

// Absolutní cesty umožní stejné komponenty i pod /produkty/nazev/.
function rootAssets(html) {
  return html.replace(/(\b(?:src|href)=")((?:assets\/|style\.css|site-config\.js|products\.js|catalog\.js|inquiry\.js|app\.js)[^"]*)"/g, '$1/$2"');
}
const template = rootAssets(fs.readFileSync(path.join(source, 'index.html'), 'utf8'));
const brandTitle = 'Z lůna přírody — ručně vyráběná péče';
const description = 'Ručně vyráběné bylinné masti a kosmetika od Adély Švecové. Prohlédněte si produkty, jejich složení a domluvte se na dostupnosti.';
let homepage = template.replace(/<head>[\s\S]*?<\/head>/, head(brandTitle, description, '/'));
homepage = homepage.replace('<div class="product-grid" id="product-grid"></div>', `<div class="product-grid" id="product-grid">${published.map(product => catalog.card(product)).join('')}</div>`);
homepage = homepage.replace('<div class="scents" id="scents"></div>', `<div class="scents" id="scents">${scents.map(([name, file]) =>
  `<figure><img src="/assets/design/${file}.webp" alt="" loading="lazy" decoding="async"><figcaption>${esc(name)}</figcaption></figure>`
).join('')}</div>`);
homepage = homepage.replace('<tbody id="packaging-deposits"></tbody>', `<tbody id="packaging-deposits">${Object.entries(packagingDeposits).map(([volume, amount]) =>
  `<tr><th scope="row">${esc(volume)}</th><td>${catalog.price(amount)}</td></tr>`
).join('')}</tbody>`);
fs.writeFileSync(path.join(output, 'index.html'), homepage);

const header = template.match(/<header class="header">[\s\S]*?<\/header>/)?.[0].replace(/href="#/g, 'href="/#');
const footer = template.match(/<footer class="section">[\s\S]*?<\/footer>/)?.[0].replace(/href="#/g, 'href="/#');
const dialogs = template.slice(template.indexOf('<p class="cart-status"'), template.indexOf('<script src='));
if (!header || !footer || !dialogs.includes('inquiry-dialog')) throw new Error('V šabloně chybí hlavička, patička nebo formulář.');
const scripts = '<script src="/site-config.js"></script><script src="/products.js"></script><script src="/catalog.js"></script><script src="/inquiry.js"></script><script src="/app.js"></script><script src="/gallery.js"></script>';
const privacyDir = path.join(output, 'soukromi');
fs.mkdirSync(privacyDir);
fs.writeFileSync(path.join(privacyDir, 'index.html'), `<!doctype html><html lang="cs">
${head('Osobní údaje a soukromí | Z lůna přírody', 'Informace o soukromí při použití ukázky poptávky.', '/soukromi/', true)}
<body>${header}
<main class="section legal-page">
  <h1>Osobní údaje a soukromí</h1>
  <h2>Košík</h2>
  <p>Prohlížeč si po dobu návštěvy v otevřené kartě pamatuje vybrané produkty, množství a vůně. Kontaktní údaje se do košíku neukládají.</p>
  <h2>Ukázka nezávazné poptávky</h2>
  <p>Pro vyzkoušení použijte smyšlené jméno a e-mail, například test@example.com. Formulář vytvoří text poptávky z položek v košíku, kontaktních údajů a případné poznámky o vracených obalech. Web formulář neodesílá ani neukládá. Po zavření dialogu se vyplněné údaje i náhled vymažou.</p>
  <h2>Přímý kontakt</h2>
  <p>Máte-li dotaz k produktům nebo k osobním údajům, napište Adéle Švecové na <a href="mailto:${esc(config.email)}">${esc(config.email)}</a>. Pokud odešlete vlastní e-mail, zpráva a kontaktní údaje se doručí do její schránky.</p>
  ${showPrivacyDraft ? '<p><a href="/soukromi/koncept.html">Místní koncept informací pro budoucí provoz</a></p>' : ''}
</main>${footer}</body></html>`);
if (showPrivacyDraft) {
  const draftContent = privacyDraft.match(/<main class="section legal-page">[\s\S]*?<\/main>/)?.[0];
  if (!draftContent) throw new Error('V konceptu ochrany osobních údajů chybí hlavní obsah.');
  const updatedDraft = draftContent
    .replace('<aside class="legal-pending">', '<aside class="legal-pending"><p>Text popisuje plánovanou e-mailovou poptávku. V současné ukázce se pouze zobrazí text ve formuláři.</p>')
    .replace('nepoužívá localStorage ani sessionStorage', 'ukládá do sessionStorage pouze produkty, množství a vůně v košíku');
  fs.writeFileSync(path.join(privacyDir, 'koncept.html'), `<!doctype html><html lang="cs">
  ${head('Koncept ochrany osobních údajů | Z lůna přírody', 'Místní koncept informací pro budoucí provoz.', '/soukromi/koncept.html', true)}
  <body>${header}${updatedDraft}${footer}</body></html>`);
}
for (const product of published) {
  const pagePath = catalog.url(product);
  const scentField = product.scentChoice
    ? `<label class="scent-field" id="vyber-vune" for="product-scent">
      <span>Vyberte si vůni</span>
      <select id="product-scent">
        <option value="">Vůni domluvíme později</option>
        ${scents.map(([name]) => `<option>${esc(name)}</option>`).join('')}
      </select>
    </label>`
    : '';
  const page = `<!doctype html><html lang="cs">
${head(`${product.name} · ${product.volume} | Z lůna přírody`, product.description, pagePath, false, catalog.photos(product)[0])}
<body>${header}
<main class="section product-page">
  <nav class="breadcrumbs" aria-label="Drobečková navigace"><a href="/">Úvod</a><span aria-hidden="true">/</span><a href="/#produkty">Produkty</a><span aria-hidden="true">/</span><span aria-current="page">${esc(product.name)}</span></nav>
  <div class="detail-layout">${catalog.gallery(product)}<div>
    <p class="eyebrow">${esc(product.category)} · ${esc(product.volume)}</p>
    <h1>${esc(product.name)}</h1><p class="detail-price">${catalog.price(product.price)}</p>
    <p class="detail-deposit">+ ${catalog.price(catalog.packagingDeposit(product))} <a href="/#obaly">záloha za vratný obal</a></p>
    <p class="product-description">${esc(product.description)}</p>
    <h2>Složení</h2><p>${esc(product.ingredients)}</p>
    <p class="product-availability">Dostupnost a možnosti předání či doručení potvrdíme e-mailem.</p>
    <form id="product-order" data-product-id="${esc(product.id)}" hidden>
      ${scentField}
      <div class="product-order-actions">
        <label class="product-quantity" for="product-quantity">Množství (ks)
          <input id="product-quantity" type="number" inputmode="numeric" min="1" max="${config.maxCartQuantity}" step="1" value="1" required>
        </label>
        <button class="button" type="submit">Přidat do košíku</button>
      </div>
    </form>
    <noscript><p>Napište nám na <a class="privacy-link" href="mailto:${esc(config.email)}">${esc(config.email)}</a> a uveďte název produktu.</p></noscript>
  </div></div>
  <a class="button secondary" href="/#produkty">← Všechny produkty</a>
</main>${footer}${dialogs}${scripts}</body></html>`;
  const directory = path.join(output, 'produkty', product.id);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), page);
}
const urls = ['/', ...published.map(catalog.url)].map(url => `<url><loc>${esc(new URL(url, base).href)}</loc></url>`).join('\n');
fs.writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', base).href}\n`);
for (const asset of ['favicon.ico', 'favicon-96.png', 'apple-touch-icon.png', 'assets/social-card.png']) {
  if (!fs.existsSync(path.join(output, asset))) throw new Error(`Chybí soubor ${asset}.`);
}
console.log(`Vygenerováno: úvod, ${published.length} produktových stránek a sitemap. Hlavní adresa: ${base.href}`);
