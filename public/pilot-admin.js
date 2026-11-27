const field = id => document.getElementById(id);
const login = field('login');
const edit = field('edit');
const logout = field('logout');
const picker = field('product');
const pickerGroup = field('product-picker');
const preview = field('preview');
const publish = field('publish');
const status = field('status');
const publishFields = ['price', 'description', 'ingredients'];
const currency = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
let revision;
let activeProduct;
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
  edit.hidden = logout.hidden = preview.hidden = pickerGroup.hidden = true;
  field('preview-photo').removeAttribute('src');
}

function render({ products, product, deposit, draft, current }) {
  activeProduct = product.id;
  revision = current;
  dirty = false;
  if (!picker.options.length) {
    picker.replaceChildren(...products.map(({ id, name }) => new Option(name, id)));
  }
  picker.value = activeProduct;
  login.hidden = true;
  edit.hidden = logout.hidden = pickerGroup.hidden = false;
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
  const controls = [control, picker, logout];
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
  edit.reset();
  revision = undefined;
  activeProduct = undefined;
  dirty = false;
  showLogin();
  status.textContent = 'Odhlášeno.';
}));

picker.addEventListener('change', () => {
  const selected = picker.value;
  if (selected === activeProduct) return;
  picker.value = activeProduct;
  if (dirty && !window.confirm('Přepnout na jiný produkt a zahodit neuložené úpravy formuláře?')) return;
  action(picker, async () => {
    const next = await request('state', undefined, selected);
    render(next);
    status.textContent = '';
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
  const file = field('photo').files[0];
  action(event.submitter, async () => {
    const fields = [...edit.elements].filter(control => control !== event.submitter);
    fields.forEach(control => { control.disabled = true; });
    try {
      status.textContent = file ? 'Připravuji fotku…' : 'Ukládám koncept…';
      const image = await preparePhoto(file);
      render(await request('draft', { ...values, image }));
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
  revision = data.current;
  preview.hidden = true;
  status.textContent = 'Verze je zveřejněná na preview.';
}));

load();
