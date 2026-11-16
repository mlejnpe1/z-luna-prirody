'use strict';
// Společné vykreslení katalogu pro prohlížeč i generování statických stránek.
const Catalog = (() => {
  const artMap = {
    lavender: ['3.png', '890 80 390 590'], rosemary: ['4.png', '130 510 1070 200'],
    calendula: ['5.png', '790 100 490 520'], zinc: ['6.png', '790 150 510 460'],
    lips: ['8.png', '870 160 430 450'], oil: ['9.png', '950 130 290 510'],
    butter: ['10.png', '780 170 510 450'], nails: ['11.png', '850 175 420 400']
  };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const price = value => new Intl.NumberFormat('cs-CZ', {style:'currency',currency:'CZK',maximumFractionDigits:0}).format(value);
  const url = product => `/produkty/${encodeURIComponent(product.id)}/`;
  const photos = product => Array.isArray(product.photos) ? product.photos : [];
  function art(product) {
    const [file, box] = artMap[product.art] || artMap.lavender;
    return `<div class="product-art"><span class="volume">${escape(product.volume)}</span><svg viewBox="${box}" aria-hidden="true"><image href="/assets/${file}" width="1366" height="768"/></svg></div>`;
  }
  function card(p) {
    const firstPhoto = photos(p)[0];
    const picture = firstPhoto ? `<div class="product-art product-photo"><span class="volume">${escape(p.volume)}</span><img src="${escape(firstPhoto.thumbnail || firstPhoto.src)}" alt="${escape(firstPhoto.alt)}" loading="lazy" decoding="async"></div>` : art(p);
    return `<article class="product-card"><a class="product-art-button" href="${url(p)}" aria-label="Zobrazit ${escape(p.name)}">${picture}</a><span class="card-category">${escape(p.category)}</span><h3><a href="${url(p)}">${escape(p.name)}</a></h3><div class="card-bottom"><span>${price(p.price)}</span><a class="details-link" href="${url(p)}">Prohlédnout ↗</a></div></article>`;
  }
  function gallery(product) {
    const images = photos(product);
    if (!images.length) return art(product);
    const first = images[0];
    const controls = images.length > 1 ? `<div class="gallery-controls" data-gallery-controls hidden><div class="gallery-navigation"><button type="button" data-gallery-step="-1" aria-label="Předchozí fotografie">←</button><p class="gallery-status" role="status" aria-atomic="true">Fotografie 1 z ${images.length}</p><button type="button" data-gallery-step="1" aria-label="Další fotografie">→</button></div><div class="gallery-thumbnails" role="group" aria-label="Výběr fotografie">${images.map((photo, index) => `<button type="button" class="gallery-thumbnail" data-gallery-index="${index}" aria-label="Fotografie ${index + 1}: ${escape(photo.alt)}" aria-pressed="${index === 0}" aria-controls="gallery-main-image"><img src="${escape(photo.thumbnail || photo.src)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div></div><noscript><p class="gallery-nojs">Další fotografie: ${images.slice(1).map((photo,index)=>`<a href="${escape(photo.src)}" target="_blank" rel="noopener noreferrer">${index + 2} — ${escape(photo.alt)}</a>`).join(' · ')}</p></noscript>` : '';
    return `<section class="product-gallery" data-gallery="${escape(product.id)}" aria-label="Fotografie produktu ${escape(product.name)}"><figure class="gallery-figure"><a class="gallery-full" href="${escape(first.src)}" target="_blank" rel="noopener noreferrer" aria-label="Otevřít fotografii v plné velikosti (nová karta)"><img id="gallery-main-image" class="gallery-main-image" src="${escape(first.src)}" alt="${escape(first.alt)}" fetchpriority="high" decoding="async"></a><figcaption class="gallery-caption"${first.caption ? '' : ' hidden'}>${escape(first.caption || '')}</figcaption></figure>${controls}<p class="gallery-help">Kliknutím na fotografii ji otevřete v plné velikosti.</p></section>`;
  }
  function sharing(product) {
    return `<div class="product-sharing"><button type="button" class="text-button" data-copy-link="${escape(product.id)}">Kopírovat odkaz na produkt</button><span class="share-status" role="status"></span><label class="share-fallback" hidden>Odkaz ke zkopírování<input type="url" readonly aria-label="Odkaz na produkt"></label></div>`;
  }
  return { escape, price, url, art, photos, gallery, card, sharing };
})();
