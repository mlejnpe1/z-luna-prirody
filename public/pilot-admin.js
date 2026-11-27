const field = id => document.getElementById(id);
const login = field('login');
const edit = field('edit');
const logout = field('logout');
const picker = field('product');
const pickerGroup = field('product-picker');
const add = field('add-product');
const cancelNew = field('cancel-new');
const productActions = field('product-actions');
const visibility = field('toggle-visibility');
const discard = field('discard-draft');
const details = field('product-details');
const preview = field('preview');
const publish = field('publish');
const status = field('status');
const publishFields = ['price', 'description', 'ingredients'];
const currency = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
let revision;
let activeProduct;
let savedDraft;
let productHidden = false;
let hasPublishedVersion = false;
let creating = false;
let dirty = false;
let pending = false;

async function request(view, body, product = activeProduct) {
  const params = new URLSearchParams({ view });
  if (product) params.set('product', product);
  const res = await fetch(`/api/pilot?${params}`, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {});
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || 'Požadavek se nezdařil.'), { status: res.status });
  return data;
}

function showLogin() {
  login.hidden = false;
  edit.hidden = logout.hidden = preview.hidden = pickerGroup.hidden = productActions.hidden = true;
  picker.replaceChildren();
  edit.reset();
  field('preview-photo').removeAttribute('src');
  for (const key of ['name', 'details', 'price', 'description', 'ingredients']) field(`preview-${key}`).textContent = '';
}

function fillChoices(id, choices) {
  const select = field(id);
  if (select.options.length) return;
  select.replaceChildren(new Option('Vyberte…', ''), ...choices.map(({ value, label }) => new Option(label, value)));
}

function allowDetails(visible) {
  details.hidden = details.disabled = !visible;
}

function renderActions({ products, draft, hasPublished, hidden }) {
  savedDraft = draft;
  productHidden = hidden;
  hasPublishedVersion = hasPublished;
  picker.replaceChildren(...products.map(({ id, name, draftOnly, hidden: optionHidden }) => {
    const label = optionHidden ? ' (skrytý)' : draftOnly ? ' (koncept)' : '';
    return new Option(name + label, id);
  }));
  picker.value = activeProduct;
  productActions.hidden = false;
  field('product-visibility').textContent = hidden ? 'Skrytý na preview' :
    hasPublished ? 'Zobrazený na preview' : 'Nezveřejněný koncept';
  visibility.hidden = !hasPublished;
  visibility.textContent = hidden ? 'Znovu zobrazit produkt' : 'Skrýt produkt';
  discard.hidden = !draft;
  publish.textContent = hidden ? 'Uložit verzi skrytého produktu' : 'Zveřejnit tuto verzi na preview';
}

function render(data) {
  const { product, deposit, draft, current, editableDetails, choices } = data;
  activeProduct = product.id;
  revision = current;
  creating = false;
  dirty = false;
  renderActions(data);
  fillChoices('category', choices.categories.map(value => ({ label: value, value })));
  fillChoices('volume', choices.volumes.map(value => ({ label: value, value })));
  fillChoices('care', choices.care);
  login.hidden = true;
  edit.hidden = logout.hidden = pickerGroup.hidden = false;
  cancelNew.hidden = true;
  allowDetails(editableDetails);
  for (const key of ['name', 'category', 'volume', 'care']) field(key).value = product[key];
  field('scent-choice').checked = Boolean(product.scentChoice);
  for (const key of publishFields) field(key).value = product[key];
  field('photo').value = '';
  syncPhotoDescription();
  preview.hidden = !draft;
  const photo = product.photos?.[0];
  const image = field('preview-photo');
  image.hidden = !photo;
  if (photo) {
    image.src = photo.src;
    image.alt = photo.alt;
  } else {
    image.removeAttribute('src');
    image.alt = '';
  }
  field('preview-name').textContent = product.name;
  field('preview-details').textContent = `${product.category} · ${product.volume}`;
  field('preview-price').textContent = `${currency.format(product.price)} + ${currency.format(deposit)} záloha za obal`;
  field('preview-description').textContent = product.description;
  field('preview-ingredients').textContent = product.ingredients;
}

function syncPhotoDescription() {
  const hasPhoto = field('photo').files.length > 0;
  field('alt').hidden = field('alt-label').hidden = !hasPhoto;
  field('alt').required = hasPhoto;
  if (!hasPhoto) field('alt').value = '';
}

async function load() {
  try {
    render(await request('state'));
    status.textContent = '';
  } catch (error) {
    if (error.status === 401) showLogin();
    status.textContent = error.status === 401 ? '' : error.message;
  }
}

async function action(control, callback) {
  if (pending) return;
  pending = true;
  const controls = [control, picker, logout, add, cancelNew, visibility, discard, publish];
  controls.forEach(item => { item.disabled = true; });
  try {
    await callback();
  } catch (error) {
    if (error.status === 401 && control !== login.querySelector('button')) showLogin();
    status.textContent = error.message;
  } finally {
    controls.forEach(item => { item.disabled = false; });
    pending = false;
  }
}

function readImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Formát fotky se nepodařilo otevřít.')); };
    img.src = url;
  });
}

async function preparePhoto(file) {
  if (!file) return null;
  if (file.size > 20 * 1024 * 1024) throw new Error('Vyberte fotku do 20 MiB.');
  let image;
  try {
    image = await readImage(file);
  } catch (error) {
    if (!/\.(heic|heif)$/i.test(file.name) && !/^image\/hei[cf]/i.test(file.type)) throw error;
    const { heicTo } = await import('/pilot-heic.mjs');
    image = await readImage(await heicTo({ blob: file, type: 'image/jpeg', quality: 0.94 }));
  }
  if (image.naturalWidth * image.naturalHeight > 60_000_000) throw new Error('Vyberte fotku do 60 megapixelů.');
  const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const [type, encoded] = canvas.toDataURL('image/jpeg', 0.89).split(',');
  if (type !== 'data:image/jpeg;base64') throw new Error('Prohlížeč nedokázal připravit fotografii.');
  return encoded;
}

login.addEventListener('submit', event => {
  event.preventDefault();
  action(event.submitter, async () => {
    await request('login', { password: field('password').value });
    login.reset();
    await load();
  });
});

logout.addEventListener('click', () => action(logout, async () => {
  await request('logout', {});
  revision = undefined;
  activeProduct = undefined;
  creating = false;
  dirty = false;
  showLogin();
  status.textContent = 'Odhlášeno.';
}));

function confirmSwitch() {
  return !dirty || window.confirm('Zahodit neuložené úpravy formuláře?');
}

async function switchProduct(id) {
  edit.inert = preview.inert = productActions.inert = true;
  try {
    render(await request('state', undefined, id));
    status.textContent = '';
  } finally {
    edit.inert = preview.inert = productActions.inert = false;
  }
}

add.addEventListener('click', () => {
  if (pending || creating || !confirmSwitch()) return;
  creating = true;
  dirty = false;
  revision = null;
  picker.selectedIndex = -1;
  edit.reset();
  syncPhotoDescription();
  allowDetails(true);
  cancelNew.hidden = false;
  preview.hidden = productActions.hidden = true;
  field('preview-photo').removeAttribute('src');
  status.textContent = '';
  field('name').focus();
});

cancelNew.addEventListener('click', () => {
  if (confirmSwitch()) action(cancelNew, () => switchProduct(activeProduct));
});

picker.addEventListener('change', () => {
  const selected = picker.value;
  if (!creating && selected === activeProduct) return;
  picker.value = creating ? '' : activeProduct;
  if (confirmSwitch()) action(picker, () => switchProduct(selected));
});

visibility.addEventListener('click', () => {
  const hidden = !productHidden;
  const prompt = hidden ? 'Skrýt produkt na preview? Později ho můžete znovu zobrazit.' :
    'Zobrazit na preview poslední zveřejněnou verzi produktu?';
  if (!window.confirm(prompt)) return;
  action(visibility, async () => {
    const data = await request('visibility', { current: revision, hidden });
    if (dirty) renderActions(data);
    else render(data);
    status.textContent = hidden ? 'Produkt byl skrytý na preview.' : 'Produkt se znovu zobrazuje na preview.';
  });
});

discard.addEventListener('click', () => {
  const prompt = hasPublishedVersion ? 'Smazat koncept a neuložené úpravy? Poslední zveřejněná verze zůstane uložená.' :
    'Smazat koncept nového produktu i případné neuložené úpravy? Tuto akci nelze vrátit.';
  if (!window.confirm(prompt)) return;
  action(discard, async () => {
    edit.inert = true;
    try {
      render(await request('discard', { id: savedDraft }));
      status.textContent = 'Koncept byl smazaný.';
    } finally {
      edit.inert = false;
    }
  });
});

field('photo').addEventListener('change', syncPhotoDescription);
edit.addEventListener('input', () => { dirty = true; preview.hidden = true; status.textContent = ''; });
edit.addEventListener('submit', event => {
  event.preventDefault();
  const values = {
    price: field('price').valueAsNumber, description: field('description').value,
    ingredients: field('ingredients').value, alt: field('alt').value, current: revision,
  };
  if (!details.disabled) {
    for (const key of ['name', 'category', 'volume', 'care']) values[key] = field(key).value;
    values.scentChoice = field('scent-choice').checked;
  }
  const view = creating ? 'create' : 'draft';
  const file = field('photo').files[0];
  action(event.submitter, async () => {
    const fields = [...edit.elements].filter(control => control !== event.submitter && !control.disabled);
    fields.forEach(control => { control.disabled = true; });
    try {
      status.textContent = file ? 'Připravuji fotku…' : 'Ukládám koncept…';
      const image = await preparePhoto(file);
      render(await request(view, { ...values, image }));
      status.textContent = 'Koncept uložen.';
      preview.scrollIntoView({ block: 'start' });
    } finally {
      fields.forEach(control => { control.disabled = false; });
    }
  });
});

publish.addEventListener('click', () => action(publish, async () => {
  const approved = revision;
  const data = await request('publish', { id: approved });
  // Případné další rozepsané hodnoty v otevřeném formuláři ponecháme.
  if (dirty) {
    revision = data.current;
    renderActions(data);
  } else {
    render(data);
  }
  preview.hidden = true;
  status.textContent = data.hidden ? 'Verze je uložená. Produkt zůstává skrytý.' : 'Verze je zveřejněná na preview.';
}));

load();
