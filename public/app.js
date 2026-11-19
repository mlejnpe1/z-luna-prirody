'use strict';
const { price: currency, escape: escapeHtml } = Catalog;
const email = typeof siteConfig.email === 'string' && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(siteConfig.email.trim()) ? siteConfig.email.trim() : '';
let category = 'all';
let care = 'all';
let inquiryTrigger = null;
const inquiryDialog = document.getElementById('inquiry-dialog');
const inquiryTitle = document.getElementById('inquiry-title');
const inquiryForm = document.getElementById('inquiry-form');
const inquiryFields = ['first-name', 'last-name', 'reply-email', 'return-packaging'].map(id => document.getElementById(id));
const inquiryStatus = document.getElementById('inquiry-status');
const inquiryCopyFallback = document.getElementById('inquiry-copy-fallback');
const inquiryCopyText = document.getElementById('inquiry-copy-text');
let inquiryVersion = 0;
const productOrder = document.getElementById('product-order');
const productQuantity = document.getElementById('product-quantity');
const productScent = document.getElementById('product-scent');
const cartView = document.getElementById('cart-view');
const cartItems = document.getElementById('cart-items');
const cartStatus = document.getElementById('cart-status');
const cartKey = 'z-luna-prirody-cart';
const maxQuantity = siteConfig.maxCartQuantity;
const available = new Map(products.filter(product => product.published).map(product => [product.id, product]));
const scentNames = new Set(siteConfig.scents.map(([name]) => name));
let cart = loadCart();
let cartNoticeTimer;

function announceCart(message) {
  cartStatus.textContent = message;
  clearTimeout(cartNoticeTimer);
  cartNoticeTimer = setTimeout(() => { cartStatus.textContent = ''; }, 3000);
}

function loadCart() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(cartKey));
    if (!Array.isArray(stored)) return [];
    return stored.filter(item => {
      const product = available.get(item?.id);
      return product && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= maxQuantity
        && (item.scent === '' || (product.scentChoice && scentNames.has(item.scent)));
    });
  } catch {
    return [];
  }
}

function cartWithProducts() {
  return cart.map(item => ({ ...item, product: available.get(item.id) }));
}

function updateCart() {
  const items = cartWithProducts();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { productTotal, depositTotal, total } = Catalog.totals(items);
  document.querySelector('[data-cart-count]').textContent = count;
  document.getElementById('cart-products-total').textContent = currency(productTotal);
  document.getElementById('cart-deposit-total').textContent = currency(depositTotal);
  document.getElementById('cart-total').textContent = currency(total);
  document.getElementById('cart-empty').hidden = count > 0;
  document.getElementById('cart-summary').hidden = count === 0;

  cartItems.innerHTML = items.map(({ product, scent, quantity }, index) => {
    const variant = product.scentChoice ? ' · ' + (scent || 'Vůně po domluvě') : '';
    const label = escapeHtml(product.name + variant);
    return `<li class="cart-item" data-cart-line="${index}">
      <div><a class="cart-name" href="${Catalog.url(product)}">${escapeHtml(product.name)}</a>
        <p>${escapeHtml(product.volume + variant)}</p>
        <p>+ ${currency(Catalog.packagingDeposit(product))} záloha za kus</p></div>
      <strong class="cart-line-price">${currency(product.price * quantity)}</strong>
      <div class="cart-item-actions">
        <div class="cart-quantity">
          <button type="button" data-quantity="-1" aria-label="Ubrat kus: ${label}" ${quantity === 1 ? 'disabled' : ''}>−</button>
          <span>${quantity} ks</span>
          <button type="button" data-quantity="1" aria-label="Přidat kus: ${label}" ${quantity === maxQuantity ? 'disabled' : ''}>+</button>
        </div>
        <button class="text-button" type="button" data-quantity="remove" aria-label="Odebrat: ${label}">Odebrat</button>
      </div>
    </li>`;
  }).join('');
}

function saveCart() {
  try { sessionStorage.setItem(cartKey, JSON.stringify(cart)); }
  catch { /* Košík zůstává dostupný na aktuální stránce. */ }
  updateCart();
}

function addProduct(productId, quantity, selectedScent) {
  const product = available.get(productId);
  if (!product) return;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return;
  const scent = product.scentChoice && scentNames.has(selectedScent) ? selectedScent : '';
  const existing = cart.find(item => item.id === product.id && item.scent === scent);
  const currentQuantity = existing?.quantity ?? 0;
  if (currentQuantity === maxQuantity) {
    announceCart(`V košíku už je ${maxQuantity} ks této varianty.`);
    return;
  }
  if (currentQuantity + quantity > maxQuantity) {
    announceCart(`Této varianty lze přidat ještě nejvýše ${maxQuantity - currentQuantity} ks.`);
    return;
  }
  if (existing) existing.quantity += quantity;
  else cart.push({ id: product.id, scent, quantity });
  saveCart();
  announceCart(`${product.name} v košíku · ${currentQuantity + quantity} ks`);
}

productOrder?.addEventListener('submit', event => {
  event.preventDefault();
  if (email) addProduct(productOrder.dataset.productId, productQuantity.valueAsNumber, productScent?.value);
});

function render() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const visible = products.filter(p => p.published
    && (category === 'all' || p.category === category)
    && (care === 'all' || p.care === care));
  document.getElementById('product-count').textContent = `Počet produktů: ${visible.length}`;
  grid.innerHTML = visible.map(product => Catalog.card(product, Boolean(email))).join('') || '<p class="empty">Této kombinaci filtrů neodpovídá žádný produkt.</p>';
}

function clearInquiryFeedback() {
  inquiryVersion += 1;
  inquiryStatus.textContent = '';
  inquiryCopyFallback.hidden = true;
  inquiryCopyText.value = '';
  document.getElementById('inquiry-error').textContent = '';
}

function clearInquiry() {
  inquiryForm.reset();
  inquiryFields.forEach(field => { field.value = ''; field.setCustomValidity(''); });
  document.getElementById('inquiry-fields').hidden = true;
  clearInquiryFeedback();
}

function showCart() {
  clearInquiry();
  inquiryTitle.textContent = 'Váš košík';
  cartView.hidden = false;
  if (!inquiryDialog.open) inquiryDialog.showModal();
  inquiryTitle.focus();
}

cartItems.addEventListener('click', event => {
  const button = event.target.closest('[data-quantity]');
  if (!button) return;
  const index = Number(button.closest('[data-cart-line]').dataset.cartLine);
  const action = button.dataset.quantity;
  if (action === 'remove') cart.splice(index, 1);
  else cart[index].quantity += Number(action);
  saveCart();
  const line = cartItems.children[Math.min(index, cart.length - 1)];
  const next = line?.querySelector(`[data-quantity="${action}"]:not(:disabled)`) || line?.querySelector('.cart-name');
  (next || inquiryTitle).focus();
});
document.getElementById('edit-cart').addEventListener('click', showCart);
document.getElementById('cart-checkout').addEventListener('click', () => {
  if (!cart.length) return;
  inquiryTitle.textContent = 'Nezávazná poptávka';
  cartView.hidden = true;
  document.getElementById('inquiry-fields').hidden = false;
  document.getElementById('first-name').focus();
});

inquiryFields.forEach(field => field.addEventListener('input', () => {
  field.setCustomValidity('');
  clearInquiryFeedback();
}));
inquiryForm.addEventListener('submit', async event => {
  event.preventDefault();
  clearInquiryFeedback();
  const version = inquiryVersion;
  inquiryFields.forEach(field => { field.value = field.value.trim(); });
  const firstName = document.getElementById('first-name');
  if (!firstName.value) firstName.setCustomValidity('Vyplňte prosím své jméno.');
  if (!inquiryForm.reportValidity() || !cart.length) return;
  try {
    const message = Inquiry.build(cartWithProducts(), {
      firstName: firstName.value,
      lastName: document.getElementById('last-name').value,
      email: document.getElementById('reply-email').value,
      returnPackaging: document.getElementById('return-packaging').value
    }, email);
    if (event.submitter?.value !== 'copy') {
      const link = document.createElement('a');
      link.href = message.href;
      link.click();
      return;
    }
    try {
      await navigator.clipboard.writeText(message.body);
      if (inquiryVersion === version) inquiryStatus.textContent = `Text je zkopírovaný. Vložte ho do e-mailu pro ${email}.`;
    } catch {
      if (inquiryVersion !== version) return;
      inquiryStatus.textContent = `Označený text zkopírujte do e-mailu pro ${email}.`;
      inquiryCopyFallback.hidden = false;
      inquiryCopyText.value = message.body;
      inquiryCopyText.focus();
      inquiryCopyText.select();
    }
  } catch (error) {
    document.getElementById('inquiry-error').textContent = error.message;
  }
});
inquiryDialog.addEventListener('close', () => {
  clearInquiry();
  if (inquiryTrigger?.isConnected) inquiryTrigger.focus();
});
function outsideCart(event) {
  if (event.target !== inquiryDialog) return false;
  const { left, right, top, bottom } = inquiryDialog.getBoundingClientRect();
  return event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom;
}
let cartPointerStartedOutside = false;
inquiryDialog.addEventListener('pointerdown', event => {
  cartPointerStartedOutside = outsideCart(event);
});
inquiryDialog.addEventListener('click', event => {
  if (cartPointerStartedOutside && outsideCart(event)) inquiryDialog.close();
  cartPointerStartedOutside = false;
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

const categoryFilter = document.getElementById('catalog-category');
categoryFilter?.addEventListener('change', () => {
  category = categoryFilter.value;
  render();
});
const careFilters = document.querySelectorAll('[data-care]');
careFilters.forEach(button => button.addEventListener('click', () => {
  care = button.dataset.care;
  careFilters.forEach(b => {
    b.setAttribute('aria-pressed', String(b === button));
  });
  render();
}));
document.addEventListener('click', event => {
  const close = event.target.closest('[data-close]');
  const open = event.target.closest('[data-open-cart]');
  if (open && email) {
    inquiryTrigger = open;
    showCart();
  }
  if (close) document.getElementById(close.dataset.close).close();
});
renderContacts();
const catalogTools = document.getElementById('catalog-tools');
if (catalogTools) catalogTools.hidden = false;
if (productOrder) productOrder.hidden = !email;
render();
document.querySelectorAll('[data-open-cart]').forEach(button => { button.hidden = !email; });
updateCart();
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    cart = loadCart();
    updateCart();
  }
});
