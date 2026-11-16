'use strict';
const artMap = {
  lavender: ['3.png', '890 80 390 590'], rosemary: ['4.png', '130 510 1070 200'],
  calendula: ['5.png', '790 100 490 520'], zinc: ['6.png', '790 150 510 460'],
  lips: ['8.png', '870 160 430 450'], oil: ['9.png', '950 130 290 510'],
  butter: ['10.png', '780 170 510 450'], nails: ['11.png', '850 175 420 400']
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currency = value => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value);
const email = typeof siteConfig.email === 'string' && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(siteConfig.email.trim()) ? siteConfig.email.trim() : '';
let category = 'all';

function art(product) {
  const [file, box] = artMap[product.art] || artMap.lavender;
  return `<div class="product-art"><span class="volume">${esc(product.volume)}</span><svg viewBox="${box}" aria-hidden="true"><image href="assets/${file}" width="1366" height="768"/></svg></div>`;
}

function render() {
  const visible = products.filter(p => p.published && (category === 'all' || p.category === category));
  document.getElementById('product-count').textContent = `Počet produktů: ${visible.length}`;
  document.getElementById('product-grid').innerHTML = visible.map(p => `<article class="product-card"><button class="product-art-button" data-detail="${esc(p.id)}" aria-label="Zobrazit ${esc(p.name)}">${art(p)}</button><span class="card-category">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="card-bottom"><span>${currency(p.price)}</span><button class="details-link" data-detail="${esc(p.id)}">Prohlédnout ↗</button></div></article>`).join('') || '<p class="empty">V této kategorii zatím nejsou žádné produkty.</p>';
}

function showDetail(id) {
  const product = products.find(p => p.id === id && p.published);
  if (!product) return;
  const inquiry = email ? '<a class="button" id="product-inquiry">Napsat o produktu ↗</a>' : '';
  document.getElementById('product-detail').innerHTML = `<div class="detail-layout">${art(product)}<div><span class="card-category">${esc(product.category)} · ${esc(product.volume)}</span><h2 id="detail-title">${esc(product.name)}</h2><p class="detail-price">${currency(product.price)}</p><p>${esc(product.description)}</p><h3>Složení</h3><p>${esc(product.ingredients)}</p><p class="small">Ilustrační vyobrazení.</p>${inquiry}</div></div>`;
  if (email) document.getElementById('product-inquiry').href = `mailto:${email}?subject=${encodeURIComponent('Zájem o produkt: ' + product.name)}&body=${encodeURIComponent('Dobrý den, mám zájem o ' + product.name + ' (' + product.volume + '). Prosím o informaci o dostupnosti. Děkuji.')}`;
  document.getElementById('product-dialog').showModal();
}

function renderContacts() {
  const container = document.getElementById('contact-details');
  const links = [];
  if (email) {
    const link = document.createElement('a');
    link.className = 'text-link';
    link.href = 'mailto:' + email;
    link.textContent = email;
    links.push(link);
  }
  try {
    const url = new URL(siteConfig.instagramUrl);
    if (url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname)) {
      const link = document.createElement('a');
      link.className = 'text-link';
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Instagram ↗';
      links.push(link);
    }
  } catch { /* Sociální profil není vyplněný. */ }
  const hasContact = links.length > 0;
  if (!email) {
    const placeholder = document.createElement('span');
    placeholder.className = 'text-link';
    placeholder.textContent = 'E-mail bude doplněn.';
    links.push(placeholder);
  }
  container.classList.toggle('contact-placeholder', !hasContact);
  container.replaceChildren(...links);
  if (!hasContact) {
    document.getElementById('contact-lead').textContent = 'Možnost kontaktování brzy doplníme.';
  }
}

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(b => {
    b.classList.toggle('active', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  });
  render();
}));
document.addEventListener('click', event => {
  const detail = event.target.closest('[data-detail]');
  const close = event.target.closest('[data-close]');
  if (detail) showDetail(detail.dataset.detail);
  if (close) document.getElementById(close.dataset.close).close();
});
renderContacts();
render();
