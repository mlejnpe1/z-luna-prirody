'use strict';
// Připraví poptávku pro poštovní aplikaci zákazníka.
const Inquiry = (() => {
  function singleLine(value, maxLength) {
    const text = String(value ?? '').trim();
    if (text.length > maxLength || /[\r\n\u0000-\u001f\u007f]/.test(text)) {
      throw new Error('Zkontrolujte délku a obsah vyplněných údajů.');
    }
    return text;
  }
  function build(items, contact, recipient) {
    if (!items.length) throw new Error('V košíku nejsou žádné produkty.');
    const firstName = singleLine(contact.firstName, 80);
    const lastName = singleLine(contact.lastName, 80);
    const replyEmail = singleLine(contact.email, 254);
    const returnPackaging = singleLine(contact.returnPackaging, 120);
    const validEmail = value => /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value);
    const validRecipient = /^[a-z0-9._+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(recipient);
    if (!firstName || !validEmail(replyEmail) || !validRecipient) {
      throw new Error('Vyplňte jméno a platnou e-mailovou adresu.');
    }
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const subject = items.length === 1
      ? 'Poptávka: ' + singleLine(items[0].product.name, 120)
      : 'Poptávka: vybrané produkty';
    const lines = items.map(({ product, quantity, scent }) => {
      const variant = scent ? ` — vůně: ${singleLine(scent, 80)}` : '';
      return `- ${quantity}× ${product.name} (${product.volume})${variant}`;
    });
    const { productTotal, depositTotal, total } = Catalog.totals(items);
    const currency = Catalog.price;
    const body = [
      'Dobrý den,', '',
      'mám zájem o tyto produkty:', ...lines, '',
      `Produkty: ${currency(productTotal)}`,
      `Záloha za vratné obaly: ${currency(depositTotal)}`,
      `Celkem včetně záloh: ${currency(total)}`,
      ...(returnPackaging ? [`Obaly k vrácení: ${returnPackaging}`] : []), '',
      'Prosím o potvrzení dostupnosti a konečné ceny. Způsob převzetí a platby si s vámi domluvím.',
      '', `Jméno: ${name}`, `E-mail pro odpověď: ${replyEmail}`, '',
      'Jde o nezávaznou poptávku.',
      '', 'Děkuji.', name
    ].join('\r\n');
    const href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { subject, body, href };
  }
  return { build };
})();
