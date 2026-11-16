const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
for (const file of ['products.js', 'inquiry.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), context);
}
const build = vm.runInContext('Inquiry.build', context);
const catalog = vm.runInContext('products', context);
const recipient = 'z.luna.prirody@seznam.cz';
const contact = { firstName: '  Žofie & <Test>  ', lastName: '', email: 'zofie+test@example.com' };
for (const product of catalog.filter(p => p.published)) {
  const message = build(product, contact, recipient);
  assert.equal(message.href, undefined);
  assert.equal(message.subject, `Poptávka: ${product.name}`);
  assert.ok(message.body.includes(`${product.name} (${product.volume})`));
  assert.ok(message.body.includes('Jméno: Žofie & <Test>\r\n'));
  assert.ok(message.body.includes('E-mail pro odpověď: zofie+test@example.com'));
  assert.ok(message.body.includes('nezávaznou poptávku'));
}
for (const invalid of [
  { firstName: '   ' },
  { firstName: 'Eva\r\nBcc: other@example.com' },
  { lastName: 'X'.repeat(81) },
  { email: 'invalid-email' },
  { email: 'a@example.com?bcc=other@example.com' },
  { email: 'a@example.com\r\nBcc: other@example.com' }
]) {
  assert.throws(() => build(catalog[0], { ...contact, ...invalid }, recipient));
}
assert.throws(() => build(catalog[0], contact, 'x@example.com?bcc=other@example.com'));
console.log('OK: ukázka pro 8 produktů, české znaky, nepovinné příjmení a 7 chybných vstupů. Náhled nevytváří odkaz pro odeslání.');
