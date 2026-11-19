const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const context = vm.createContext({});
for (const file of ['products.js', 'site-config.js']) vm.runInContext(fs.readFileSync(path.join(root, 'public', file), 'utf8'), context);
const { products, config } = vm.runInContext('({products,config:siteConfig})', context);
const published = products.filter(p => p.published);
function read(file) { return fs.readFileSync(path.join(output, file), 'utf8'); }
const files = ['index.html', 'soukromi/index.html', ...published.map(p => `produkty/${p.id}/index.html`)];
for (const file of files) {
  const html = read(file);
  assert.equal((html.match(/<title>/g) || []).length, 1, file);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, file);
  const product = published.find(p => file === `produkty/${p.id}/index.html`);
  const image = product?.photos?.[0]?.src || '/assets/social-card.png';
  assert.ok(html.includes('<meta property="og:image" content="' + new URL(image, config.siteUrl).href + '"'), file);
  assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), file);
  assert.ok(!html.includes('localhost') && !html.includes('127.0.0.1'), file);
  assert.ok(!html.includes('ochrana-osobnich-udaju.html') && !html.includes('legal-pending'), file);
  assert.ok(!html.includes('id="inquiry-preview"') && !html.includes('test@example.com'), file);
  assert.ok(html.includes('mailto:mlejnek.petr.ml@gmail.com'), file);
  assert.ok(html.includes('href="/soukromi/"'), file);
  for (const match of html.matchAll(/(?:src|href)="(\/(?!\/)[^"]*)"/g)) {
    let local = match[1].split(/[?#]/)[0];
    if (local.endsWith('/')) local += 'index.html';
    assert.ok(fs.existsSync(path.join(output, local)), `${file} odkazuje na chybějící ${local}`);
  }
}
for (const product of published) {
  const html = read(`produkty/${product.id}/index.html`);
  assert.ok(html.includes(`<h1>${product.name}</h1>`));
  assert.ok(html.includes(`data-product-id="${product.id}"`));
  assert.ok(html.includes(`id="product-quantity" type="number" inputmode="numeric" min="1" max="${config.maxCartQuantity}"`));
  assert.ok(!html.includes('Kopírovat odkaz na produkt') && !html.includes('Ilustrační vyobrazení.'));
  assert.ok(html.includes(`href="${new URL(`/produkty/${product.id}/`, config.siteUrl).href}"`));
  assert.ok(html.includes(product.description));
  assert.ok(html.includes(product.ingredients));
  assert.ok(html.includes('href="/#obaly"'));
}
assert.ok(!fs.existsSync(path.join(output, 'ochrana-osobnich-udaju.html')));
assert.ok(!fs.existsSync(path.join(output, 'soukromi/koncept.html')));
assert.ok(!read('sitemap.xml').includes('ochrana-osobnich-udaju'));
assert.equal((read('sitemap.xml').match(/<loc>/g) || []).length, published.length + 1);
for (const [file, width, height] of [['assets/social-card.png',1200,630],['favicon-96.png',96,96],['apple-touch-icon.png',180,180]]) {
  const bytes = fs.readFileSync(path.join(output, file));
  assert.equal(bytes.subarray(1,4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
}
const ico = fs.readFileSync(path.join(output, 'favicon.ico'));
assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3);
assert.deepEqual([ico[6],ico[22],ico[38]], [16,32,48]);
console.log(`OK: ${files.length} HTML stránek, všechny lokální odkazy, metadata, sitemap, rozměry obrázků a ICO.`);
