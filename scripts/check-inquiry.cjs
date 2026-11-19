const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['site-config.js', 'products.js', 'catalog.js', 'inquiry.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), context);
}
const build = vm.runInContext('Inquiry.build', context);
const catalog = vm.runInContext('products', context);
const recipient = 'z.luna.prirody@seznam.cz';
const contact = { firstName: '  Žofie & <Test>  ', lastName: '', email: 'zofie+test@example.com' };
for (const product of catalog.filter(p => p.published)) {
  const message = build([{ product, quantity: 1 }], contact, recipient);
  assert.equal(message.href, undefined);
  assert.equal(message.subject, `Poptávka: ${product.name}`);
  assert.ok(message.body.includes(`${product.name} (${product.volume})`));
  assert.ok(message.body.includes('Jméno: Žofie & <Test>\r\n'));
  assert.ok(message.body.includes('E-mail pro odpověď: zofie+test@example.com'));
  assert.ok(message.body.includes('nezávaznou poptávku'));
}
const together = [
  { product: catalog.find(p => p.id === 'balzam-na-rty'), quantity: 2, scent: 'Levandule' },
  { product: catalog.find(p => p.id === 'balzam-na-rty'), quantity: 1, scent: 'Pomeranč' },
  { product: catalog[0], quantity: 3 }
];
const combined = build(together, { ...contact, returnPackaging: '2× 50 ml' }, recipient);
assert.equal(combined.href, undefined);
assert.equal(combined.subject, 'Poptávka: vybrané produkty');
assert.ok(combined.body.includes('2× Balzám na rty (10 ml) — vůně: Levandule'));
assert.ok(combined.body.includes('1× Balzám na rty (10 ml) — vůně: Pomeranč'));
assert.ok(combined.body.includes('3× Levandulová mast (50 ml)'));
assert.match(combined.body, /Produkty: 795\sKč/);
assert.match(combined.body, /Záloha za vratné obaly: 150\sKč/);
assert.match(combined.body, /Celkem včetně záloh: 945\sKč/);
assert.ok(combined.body.includes('Obaly k vrácení: 2× 50 ml'));
assert.throws(() => build([], contact, recipient));
for (const invalid of [
  { firstName: '   ' },
  { firstName: 'Eva\r\nBcc: other@example.com' },
  { lastName: 'X'.repeat(81) },
  { email: 'invalid-email' },
  { email: 'a@example.com?bcc=other@example.com' },
  { email: 'a@example.com\r\nBcc: other@example.com' },
  { returnPackaging: '50 ml\nNová hlavička' }
]) {
  assert.throws(() => build(together, { ...contact, ...invalid }, recipient));
}
assert.throws(() => build(together, contact, 'x@example.com?bcc=other@example.com'));
console.log('OK: společná poptávka s množstvím a vůněmi, jednotlivé produkty a validace kontaktu. Náhled nevytváří odkaz pro odeslání.');
