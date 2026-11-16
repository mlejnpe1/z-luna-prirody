'use strict';
const { price: currency } = Catalog;
const email = typeof siteConfig.email === 'string' && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(siteConfig.email.trim()) ? siteConfig.email.trim() : '';
let category = 'all';
let inquiryTrigger = null;
let inquiryProduct = null;
const inquiryDialog = document.getElementById('inquiry-dialog');
const inquiryForm = document.getElementById('inquiry-form');
const inquiryFields = ['first-name', 'last-name', 'reply-email'].map(id => document.getElementById(id));

function render() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const visible = products.filter(p => p.published && (category === 'all' || p.category === category));
  document.getElementById('product-count').textContent = `Počet produktů: ${visible.length}`;
  grid.innerHTML = visible.map(Catalog.card).join('') || '<p class="empty">V této kategorii zatím nejsou žádné produkty.</p>';
}

function clearInquiry() {
  inquiryForm.reset();
  inquiryFields.forEach(field => { field.value = ''; field.setCustomValidity(''); });
  document.getElementById('inquiry-preview').hidden = true;
  document.getElementById('inquiry-fields').hidden = false;
  document.getElementById('email-subject').textContent = '';
  document.getElementById('email-body').value = '';
  document.getElementById('inquiry-error').textContent = '';
  inquiryProduct = null;
}

function showInquiry(product) {
  clearInquiry();
  inquiryProduct = product;
  document.getElementById('email-recipient').textContent = email;
  document.getElementById('inquiry-product').textContent = `${product.name} · ${product.volume} · ${currency(product.price)}`;
  inquiryDialog.showModal();
  document.getElementById('first-name').focus();
}

inquiryFields.forEach(field => field.addEventListener('input', () => {
  field.setCustomValidity('');
  document.getElementById('inquiry-error').textContent = '';
}));
inquiryForm.addEventListener('submit', event => {
  event.preventDefault();
  inquiryFields.forEach(field => { field.value = field.value.trim(); });
  const firstName = document.getElementById('first-name');
  if (!firstName.value) firstName.setCustomValidity('Vyplňte prosím své jméno.');
  if (!inquiryForm.reportValidity() || !inquiryProduct) return;
  try {
    const message = Inquiry.build(inquiryProduct, {
      firstName: firstName.value,
      lastName: document.getElementById('last-name').value,
      email: document.getElementById('reply-email').value
    }, email);
    document.getElementById('email-subject').textContent = message.subject;
    document.getElementById('email-body').value = message.body;
    document.getElementById('inquiry-fields').hidden = true;
    document.getElementById('inquiry-preview').hidden = false;
    document.getElementById('preview-title').focus();
  } catch (error) {
    document.getElementById('inquiry-error').textContent = error.message;
  }
});
document.getElementById('edit-inquiry').addEventListener('click', () => {
  document.getElementById('inquiry-preview').hidden = true;
  document.getElementById('inquiry-fields').hidden = false;
  document.getElementById('email-body').value = '';
  document.getElementById('first-name').focus();
});
inquiryDialog.addEventListener('close', () => {
  clearInquiry();
  if (inquiryTrigger?.isConnected) inquiryTrigger.focus();
});
window.addEventListener('pagehide', () => {
  if (inquiryDialog.open) inquiryDialog.close();
  clearInquiry();
});

function renderContacts() {
  const container = document.getElementById('contact-details');
  if (!container) return;
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
document.addEventListener('click', async event => {
  const close = event.target.closest('[data-close]');
  const inquiry = event.target.closest('[data-inquiry]');
  const copy = event.target.closest('[data-copy-link]');
  if (inquiry) {
    const product = products.find(p => p.id === inquiry.dataset.inquiry && p.published);
    if (product && email) { inquiryTrigger = inquiry; showInquiry(product); }
  }
  if (copy) {
    const product = products.find(p => p.id === copy.dataset.copyLink && p.published);
    if (!product) return;
    const url = new URL(Catalog.url(product), window.location.origin).href;
    const container = copy.closest('.product-sharing');
    const status = container.querySelector('.share-status');
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Odkaz je zkopírovaný.';
    } catch {
      const fallback = container.querySelector('.share-fallback');
      fallback.hidden = false;
      const field = fallback.querySelector('input');
      field.value = url;
      field.focus();
      field.select();
      status.textContent = 'Zkopírujte prosím označený odkaz.';
    }
  }
  if (close) document.getElementById(close.dataset.close).close();
});
renderContacts();
render();
document.querySelectorAll('[data-inquiry]').forEach(button => { button.hidden = !email; });
