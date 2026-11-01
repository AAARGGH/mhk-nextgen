const $ = selector => document.querySelector(selector);
const api = (action, options = {}) => fetch(`api.php?action=${action}`, options).then(async response => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Die Anfrage ist fehlgeschlagen.');
  return data;
});

let projects = [];
let selectedId = null;
let csrf = '';
let dirty = false;
let supportersDirty = false;
let supportersLoaded = false;
let supporters = [];

const fields = {
  title: $('#title'), year: $('#year'), teaser: $('#teaser'), text: $('#text'),
  linkUrl: $('#link-url'), linkLabel: $('#link-label'), alt: $('#alt'), published: $('#published')
};

function setDirty(value) {
  dirty = value;
  $('#save-state').textContent = (value || supportersDirty) ? 'Nicht gespeicherte Änderungen' : 'Alles gespeichert';
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 2600);
}

function currentProject() {
  return projects.find(project => project.id === selectedId);
}

function syncFormToProject() {
  const project = currentProject();
  if (!project) return;
  Object.entries(fields).forEach(([key, field]) => project[key] = field.type === 'checkbox' ? field.checked : field.value);
  project.year = Number(project.year);
}

function renderList() {
  const query = $('#search').value.trim().toLocaleLowerCase('de');
  const container = $('#project-list');
  container.replaceChildren();
  projects.forEach(project => {
    if (query && !`${project.title} ${project.year}`.toLocaleLowerCase('de').includes(query)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `project-item${project.id === selectedId ? ' active' : ''}`;
    const title = document.createElement('strong');
    title.textContent = project.title || 'Unbenanntes Projekt';
    const year = document.createElement('span');
    year.textContent = project.year;
    button.append(title, year);
    if (!project.published) {
      const draft = document.createElement('span');
      draft.className = 'draft';
      draft.textContent = 'Entwurf';
      button.append(draft);
    }
    button.addEventListener('click', () => selectProject(project.id));
    container.append(button);
  });
}

const imageUrl = path => /^https?:\/\//i.test(path) ? path : `../${path}`;
const cropFor = project => project.thumbnailCrop || {x: 50, y: 50, zoom: 1};

function updateCover() {
  const project = currentProject();
  const path = project?.thumbnail || project?.images?.[0];
  $('#cover-editor').hidden = !path;
  if (!path) return;
  const crop = cropFor(project);
  const image = $('#cover-image');
  const url = imageUrl(path);
  if (image.getAttribute('src') !== url) image.src = url;
  image.style.objectPosition = `${crop.x}% ${crop.y}%`;
  image.style.transformOrigin = `${crop.x}% ${crop.y}%`;
  image.style.transform = `scale(${crop.zoom})`;
  ['x', 'y', 'zoom'].forEach(key => $('#cover-' + key).value = crop[key]);
}

function setCoverCrop(crop) {
  const project = currentProject();
  if (!project) return;
  project.thumbnailCrop = crop;
  setDirty(true);
  updateCover();
}

function renderImages() {
  const project = currentProject();
  const container = $('#image-list');
  container.replaceChildren();
  (project?.images || []).forEach((path, index) => {
    const item = document.createElement('div');
    item.className = 'image-item';
    const image = document.createElement('img');
    image.src = imageUrl(path);
    image.alt = `Bild ${index + 1}`;
    const actions = document.createElement('div');
    actions.className = 'image-actions';
    const button = (label, title, handler, disabled = false) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.textContent = label;
      element.title = title;
      element.setAttribute('aria-label', title);
      element.disabled = disabled;
      element.addEventListener('click', handler);
      actions.append(element);
      return element;
    };
    [-1, 1].forEach(direction => button(direction < 0 ? '←' : '→',
      `Bild ${index + 1} nach ${direction < 0 ? 'vorne' : 'hinten'} verschieben`, () => {
        const target = index + direction;
        [project.images[index], project.images[target]] = [project.images[target], project.images[index]];
        setDirty(true);
        renderImages();
        const moved = container.children[target];
        moved.querySelectorAll('button')[direction < 0 ? 1 : 0].focus();
      }, index + direction < 0 || index + direction >= project.images.length));
    const isCover = (project.thumbnail || project.images[0]) === path;
    const cover = button(isCover ? 'Titelbild ✓' : 'Als Titelbild', `Bild ${index + 1} als Titelbild`, () => {
      project.thumbnail = path;
      delete project.thumbnailCrop;
      setDirty(true);
      renderImages();
    });
    cover.setAttribute('aria-pressed', String(isCover));
    button('Entfernen', `Bild ${index + 1} entfernen`, () => {
      project.images.splice(index, 1);
      if (project.thumbnail === path) {
        project.thumbnail = project.images[0] || '';
        delete project.thumbnailCrop;
      }
      setDirty(true);
      renderImages();
    });
    item.append(image, actions);
    container.append(item);
  });
  updateCover();
}

['x', 'y', 'zoom'].forEach(key => $('#cover-' + key).addEventListener('input', event => {
  setCoverCrop({...cropFor(currentProject()), [key]: Number(event.target.value)});
}));
$('#cover-reset').addEventListener('click', () => setCoverCrop({x: 50, y: 50, zoom: 1}));
let coverDrag = null;
$('#cover-preview').addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  const image = $('#cover-image');
  if (!image.naturalWidth) return;
  const box = event.currentTarget.getBoundingClientRect();
  const crop = cropFor(currentProject());
  const scale = Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight) * crop.zoom;
  coverDrag = {pointer: event.pointerId, startX: event.clientX, startY: event.clientY, crop: {...crop},
    overflowX: image.naturalWidth * scale - box.width, overflowY: image.naturalHeight * scale - box.height};
  event.currentTarget.setPointerCapture(event.pointerId);
});
$('#cover-preview').addEventListener('pointermove', event => {
  if (!coverDrag || coverDrag.pointer !== event.pointerId) return;
  const d = coverDrag;
  const position = (start, delta, overflow) => overflow > 0.01 ? Math.max(0, Math.min(100, start - delta / overflow * 100)) : start;
  setCoverCrop({...d.crop, x: position(d.crop.x, event.clientX - d.startX, d.overflowX),
    y: position(d.crop.y, event.clientY - d.startY, d.overflowY)});
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => $('#cover-preview').addEventListener(type, () => coverDrag = null));

function selectProject(id) {
  if (dirty && selectedId && !confirm('Nicht gespeicherte Änderungen verwerfen?')) return;
  selectedId = id;
  const project = currentProject();
  if (!project) return;
  Object.entries(fields).forEach(([key, field]) => {
    if (field.type === 'checkbox') field.checked = project[key] !== false;
    else field.value = project[key] ?? '';
  });
  $('#editor-title').textContent = project.title || 'Neues Projekt';
  $('#editor-kicker').textContent = project.title ? 'Projekt bearbeiten' : 'Neues Projekt';
  $('#editor').hidden = false;
  $('#empty-state').hidden = true;
  $('#editor-message').textContent = '';
  setDirty(false);
  renderImages();
  renderList();
}

async function loadProjects() {
  const data = await api('projects');
  projects = data.projects;
  csrf = data.csrf;
  $('#login-view').hidden = true;
  $('#admin-view').hidden = false;
  $('#top-actions').hidden = false;
  renderList();
  if (projects.length) selectProject(projects[0].id);
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('#login-message').textContent = '';
  try {
    const data = await api('login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: $('#password').value})});
    csrf = data.csrf;
    $('#password').value = '';
    await loadProjects();
  } catch (error) {
    $('#login-message').textContent = error.message;
  }
});

$('#new-project').addEventListener('click', () => {
  if (dirty && !confirm('Nicht gespeicherte Änderungen verwerfen?')) return;
  const id = `project-${Date.now().toString(36)}`;
  projects.unshift({id, year: new Date().getFullYear(), title: '', teaser: '', text: '', images: [], thumbnail: '', alt: '', linkUrl: '', linkLabel: '', published: false});
  selectProject(id);
  fields.title.focus();
});

$('#editor').addEventListener('input', () => {
  syncFormToProject();
  $('#editor-title').textContent = fields.title.value || 'Neues Projekt';
  setDirty(true);
  renderList();
});

$('#editor').addEventListener('submit', async event => {
  event.preventDefault();
  syncFormToProject();
  $('#editor-message').textContent = '';
  try {
    const data = await api('save', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf}, body: JSON.stringify({projects})});
    projects = data.projects;
    setDirty(false);
    renderList();
    renderImages();
    toast('Änderungen wurden veröffentlicht.');
  } catch (error) {
    $('#editor-message').textContent = error.message;
  }
});

$('#delete-project').addEventListener('click', async () => {
  const project = currentProject();
  if (!project || !confirm(`„${project.title || 'Dieses Projekt'}“ wirklich löschen?`)) return;
  projects = projects.filter(item => item.id !== project.id);
  selectedId = null;
  try {
    const data = await api('save', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf}, body: JSON.stringify({projects})});
    projects = data.projects;
    $('#editor').hidden = true;
    $('#empty-state').hidden = false;
    setDirty(false);
    renderList();
    toast('Projekt wurde gelöscht.');
  } catch (error) {
    $('#editor-message').textContent = error.message;
  }
});

$('#image-upload').addEventListener('change', async event => {
  const project = currentProject();
  if (!project) return;
  const files = [...event.target.files];
  event.target.value = '';
  for (const file of files) {
    const form = new FormData();
    form.append('image', file);
    try {
      const data = await api('upload', {method: 'POST', headers: {'X-CSRF-Token': csrf}, body: form});
      project.images.push(data.path);
      if (!project.thumbnail) project.thumbnail = data.path;
      setDirty(true);
      renderImages();
    } catch (error) {
      $('#editor-message').textContent = `${file.name}: ${error.message}`;
    }
  }
});

$('#search').addEventListener('input', renderList);
$('#logout').addEventListener('click', async () => {
  if ((dirty || supportersDirty) && !confirm('Nicht gespeicherte Änderungen verwerfen und abmelden?')) return;
  await api('logout', {method: 'POST', headers: {'X-CSRF-Token': csrf}});
  location.reload();
});
window.addEventListener('beforeunload', event => { if (dirty || supportersDirty) { event.preventDefault(); event.returnValue = ''; } });

api('status').then(data => {
  if (data.authenticated) { csrf = data.csrf; loadProjects(); }
  else if (!data.configured) $('#login-message').textContent = 'Vor der ersten Anmeldung muss ein Passwort auf dem Server eingerichtet werden.';
}).catch(error => $('#login-message').textContent = error.message);


function markSupportersDirty() {
  supportersDirty = true;
  setDirty(dirty);
}

function renderSupporters() {
  const container = $('#supporter-list');
  container.replaceChildren();
  $('#supporters-empty').hidden = supporters.length > 0;
  supporters.forEach((name, index) => {
    const row = document.createElement('div');
    row.className = 'supporter-row';
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('aria-label', `Name des Unterstützers ${index + 1}`);
    input.required = true;
    input.maxLength = 200;
    input.value = name;
    input.addEventListener('input', () => {
      supporters[index] = input.value;
      markSupportersDirty();
    });
    label.append(input);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'button danger';
    remove.textContent = 'Entfernen';
    remove.setAttribute('aria-label', `Name ${index + 1} entfernen`);
    remove.addEventListener('click', () => {
      supporters.splice(index, 1);
      markSupportersDirty();
      renderSupporters();
      const inputs = container.querySelectorAll('input');
      (inputs[Math.min(index, inputs.length - 1)] || $('#add-supporter')).focus();
    });
    row.append(label, remove);
    container.append(row);
  });
}

async function showSection(section) {
  ['projects', 'supporters'].forEach(name => {
    const active = name === section;
    $('#' + name + '-section').hidden = !active;
    const button = $('#show-' + name);
    button.className = `button ${active ? 'primary' : 'ghost'}`;
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (section !== 'supporters' || supportersLoaded) return;
  $('#supporters-message').textContent = 'Unterstützer werden geladen …';
  try {
    const data = await api('supporters');
    supporters = data.supporters;
    supportersLoaded = true;
    renderSupporters();
    $('#supporters-fields').disabled = false;
    $('#supporters-message').textContent = '';
  } catch (error) {
    $('#supporters-message').textContent = error.message + ' Zum erneuten Laden noch einmal auf Unterstützer klicken.';
  }
}
$('#show-projects').addEventListener('click', () => showSection('projects'));
$('#show-supporters').addEventListener('click', () => showSection('supporters'));
$('#add-supporter').addEventListener('click', () => {
  if (supporters.length >= 500) {
    $('#supporters-message').textContent = 'Es sind höchstens 500 Namen möglich.';
    return;
  }
  supporters.push('');
  markSupportersDirty();
  renderSupporters();
  $('#supporter-list').lastElementChild.querySelector('input').focus();
});
$('#supporters-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('#supporters-message').textContent = '';
  $('#supporters-fields').disabled = true;
  try {
    const data = await api('save-supporters', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf}, body: JSON.stringify({supporters})});
    supporters = data.supporters;
    supportersDirty = false;
    setDirty(dirty);
    renderSupporters();
    toast('Unterstützer wurden gespeichert.');
  } catch (error) {
    $('#supporters-message').textContent = error.message;
  } finally {
    $('#supporters-fields').disabled = false;
  }
});
