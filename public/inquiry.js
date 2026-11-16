'use strict';
// Ukázkový formulář pro prezentaci. Vrací jen text, bez odeslání a odkazu mailto.
const Inquiry = (() => {
  function singleLine(value, maxLength) {
    const text = String(value ?? '').trim();
    if (text.length > maxLength || /[\r\n\u0000-\u001f\u007f]/.test(text)) {
      throw new Error('Zkontrolujte délku a obsah vyplněných údajů.');
    }
    return text;
  }
  function build(product, contact, recipient) {
    const firstName = singleLine(contact.firstName, 80);
    const lastName = singleLine(contact.lastName, 80);
    const replyEmail = singleLine(contact.email, 254);
    const validEmail = value => /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value);
    if (!firstName || !validEmail(replyEmail) || !validEmail(recipient)) {
      throw new Error('Vyplňte jméno a platnou e-mailovou adresu.');
    }
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const subject = 'Poptávka: ' + singleLine(product.name, 120);
    const body = [
      'Dobrý den,', '',
      `mám zájem o produkt ${product.name} (${product.volume}).`,
      'Prosím o potvrzení dostupnosti a informaci o možnostech objednání, platby a doručení.',
      '', `Jméno: ${name}`, `E-mail pro odpověď: ${replyEmail}`, '',
      'Jde o nezávaznou poptávku. Podmínky případné objednávky si domluvíme e-mailem.',
      '', 'Děkuji.', name
    ].join('\r\n');
    return { subject, body };
  }
  return { build };
})();
