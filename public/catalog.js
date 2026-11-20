'use strict';
// Společné vykreslení katalogu pro prohlížeč i generování statických stránek.
const Catalog = (() => {
  const artMap = {
    lavender: ['levandulova-mast', '#e5deeb'],
    rosemary: ['rozmarynova-mast', '#dee5ce'],
    calendula: ['mesickova-mast', '#f0e1c4'],
    zinc: ['zinkova-mast', '#dbe6df'],
    lips: ['balzam-na-rty', '#eed8d6'],
    oil: ['vlasovy-olej', '#e4e4c8'],
    butter: ['telove-maslo', '#f4e1bd'],
    nails: ['nehtovy-balzam', '#e6dccc']
  };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const price = value => new Intl.NumberFormat('cs-CZ', {style:'currency',currency:'CZK',maximumFractionDigits:0}).format(value);
  const url = product => `/produkty/${encodeURIComponent(product.id)}/`;
  const photos = product => Array.isArray(product.photos) ? product.photos : [];
  const packagingDeposit = product => siteConfig.packagingDeposits[product.volume];
  function totals(items) {
    let productTotal = 0;
    let depositTotal = 0;
    for (const { product, quantity } of items) {
      productTotal += product.price * quantity;
      depositTotal += packagingDeposit(product) * quantity;
    }
    return { productTotal, depositTotal, total: productTotal + depositTotal };
  }
  function art(product) {
    const [file, tint] = artMap[product.art] || artMap.lavender;
    return `<div class="product-art" style="--product-tint:${tint}"><span class="volume">${escape(product.volume)}</span><img class="product-illustration ${file === 'rozmarynova-mast' ? 'rosemary' : ''}" src="/assets/design/${file}.webp" alt="" loading="lazy" decoding="async"></div>`;
  }
  function card(p, linkToScent = false) {
    const firstPhoto = photos(p)[0];
    const picture = firstPhoto ? `<div class="product-art product-photo"><span class="volume">${escape(p.volume)}</span><img src="${escape(firstPhoto.thumbnail || firstPhoto.src)}" alt="${escape(firstPhoto.alt)}" loading="lazy" decoding="async"></div>` : art(p);
    const scentLink = linkToScent && p.scentChoice;
    const details = scentLink
      ? `<a class="details-link scent-link" href="${url(p)}#vyber-vune">Vybrat vůni <span class="icon icon-arrow icon-arrow-external" aria-hidden="true"></span></a>`
      : `<a class="details-link" href="${url(p)}">Prohlédnout <span class="icon icon-arrow icon-arrow-external" aria-hidden="true"></span></a>`;
    return `<article class="product-card"><a class="product-art-button" href="${url(p)}" aria-label="Zobrazit ${escape(p.name)}">${picture}</a><span class="card-category">${escape(p.category)}</span><h3><a href="${url(p)}">${escape(p.name)}</a></h3><div class="card-bottom"><span>${price(p.price)}</span>${details}</div><p class="card-deposit">+ ${price(packagingDeposit(p))} záloha za obal</p></article>`;
  }
  function gallery(product) {
    const images = photos(product);
    if (!images.length) return art(product);
    const first = images[0];
    const controls = images.length > 1 ? `<div class="gallery-controls" data-gallery-controls hidden>
      <div class="gallery-navigation">
        <button type="button" data-gallery-step="-1" aria-label="Předchozí fotografie"><span class="icon icon-arrow icon-arrow-left" aria-hidden="true"></span></button>
        <p class="gallery-status" role="status" aria-atomic="true">Fotografie 1 z ${images.length}</p>
        <button type="button" data-gallery-step="1" aria-label="Další fotografie"><span class="icon icon-arrow" aria-hidden="true"></span></button>
      </div>
      <div class="gallery-thumbnails" role="group" aria-label="Výběr fotografie">${images.map((photo, index) => `<button type="button" class="gallery-thumbnail" data-gallery-index="${index}" aria-label="Fotografie ${index + 1}: ${escape(photo.alt)}" aria-pressed="${index === 0}" aria-controls="gallery-main-image"><img src="${escape(photo.thumbnail || photo.src)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>
    </div><noscript><p class="gallery-nojs">Další fotografie: ${images.slice(1).map((photo,index)=>`<a href="${escape(photo.src)}" target="_blank" rel="noopener noreferrer">${index + 2} — ${escape(photo.alt)}</a>`).join(' · ')}</p></noscript>` : '';
    return `<section class="product-gallery" data-gallery="${escape(product.id)}" aria-label="Fotografie produktu ${escape(product.name)}">
      <figure class="gallery-figure">
        <a class="gallery-full" href="${escape(first.src)}" aria-label="Zvětšit fotografii">
          <img id="gallery-main-image" class="gallery-main-image" src="${escape(first.src)}" alt="${escape(first.alt)}" fetchpriority="high" decoding="async">
        </a>
        <figcaption class="gallery-caption"${first.caption ? '' : ' hidden'}>${escape(first.caption || '')}</figcaption>
      </figure>
      ${controls}
      <p class="gallery-help">Kliknutím fotografii zvětšíte.</p>
      <dialog class="gallery-viewer" aria-label="Zvětšená fotografie produktu ${escape(product.name)}">
        <form class="gallery-viewer-toolbar" method="dialog">
          <button class="gallery-viewer-close" type="submit" aria-label="Zavřít fotografii" autofocus></button>
        </form>
        <img class="gallery-viewer-image" alt="">
      </dialog>
    </section>`;
  }
  return { escape, price, url, art, photos, packagingDeposit, totals, gallery, card };
})();
