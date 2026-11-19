'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const output = path.join(root, 'dist');
const config = vm.runInNewContext(fs.readFileSync(path.join(source, 'site-config.js'), 'utf8') + '\nsiteConfig');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('dist nesmí být symbolický odkaz.');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });

const html = fs.readFileSync(path.join(root, 'holding', 'index.html'), 'utf8')
  .replaceAll('{{siteUrl}}', new URL(config.siteUrl).href)
  .replaceAll('{{instagramUrl}}', new URL(config.instagramUrl).href);
for (const file of ['index.html', '404.html']) fs.writeFileSync(path.join(output, file), html);
for (const asset of ['icons.css', 'favicon.ico', 'apple-touch-icon.png', 'assets/3.png', 'assets/social-card.png']) {
  fs.copyFileSync(path.join(source, asset), path.join(output, asset));
}
fs.writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', config.siteUrl).href}\n`);
fs.writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${config.siteUrl}</loc></url></urlset>\n`);
console.log('Vygenerována dočasná úvodní stránka.');
