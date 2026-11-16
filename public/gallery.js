'use strict';
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const product = products.find(item => item.id === gallery.dataset.gallery && item.published);
  if (!product) return;
  const photos = Catalog.photos(product);
  if (photos.length < 2) return;
  const controls = gallery.querySelector('[data-gallery-controls]');
  const image = gallery.querySelector('.gallery-main-image');
  const full = gallery.querySelector('.gallery-full');
  const caption = gallery.querySelector('.gallery-caption');
  const status = gallery.querySelector('.gallery-status');
  const thumbnails = [...gallery.querySelectorAll('[data-gallery-index]')];
  let current = 0;

  function select(index, moveFocus = false) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = photo.src;
    image.alt = photo.alt;
    full.href = photo.src;
    caption.textContent = photo.caption || '';
    caption.hidden = !photo.caption;
    status.textContent = `Fotografie ${current + 1} z ${photos.length}`;
    thumbnails.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
    if (moveFocus) thumbnails[current].focus({preventScroll:true});
    thumbnails[current].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  }

  controls.hidden = false;
  gallery.addEventListener('click', event => {
    const thumbnail = event.target.closest('[data-gallery-index]');
    const step = event.target.closest('[data-gallery-step]');
    if (thumbnail) select(Number(thumbnail.dataset.galleryIndex));
    if (step) select(current + Number(step.dataset.galleryStep));
  });
  controls.addEventListener('keydown', event => {
    const targets = {ArrowLeft:current - 1, ArrowRight:current + 1, Home:0, End:photos.length - 1};
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      select(targets[event.key], true);
    }
  });
});
