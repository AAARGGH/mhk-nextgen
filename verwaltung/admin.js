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

const fields = {
  title: $('#title'), year: $('#year'), teaser: $('#teaser'), text: $('#text'),
  linkUrl: $('#link-url'), linkLabel: $('#link-label'), alt: $('#alt'), published: $('#published')
};

function setDirty(value) {
  dirty = value;
  $('#save-state').textContent = value ? 'Nicht gespeicherte Änderungen' : 'Alles gespeichert';
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

function renderImages() {
  const project = currentProject();
  const container = $('#image-list');
  container.replaceChildren();
  (project?.images || []).forEach((path, index) => {
    const item = document.createElement('div');
    item.className = 'image-item';
    const image = document.createElement('img');
    image.src = `../${path}`;
    image.alt = '';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.title = 'Bild aus Projekt entfernen';
    remove.setAttribute('aria-label', `Bild ${index + 1} entfernen`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      project.images.splice(index, 1);
      if (project.thumbnail === path) project.thumbnail = project.images[0] || '';
      setDirty(true);
      renderImages();
    });
    item.append(image, remove);
    container.append(item);
  });
}

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
  if (dirty && !confirm('Nicht gespeicherte Änderungen verwerfen und abmelden?')) return;
  await api('logout', {method: 'POST', headers: {'X-CSRF-Token': csrf}});
  location.reload();
});
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

api('status').then(data => {
  if (data.authenticated) { csrf = data.csrf; loadProjects(); }
  else if (!data.configured) $('#login-message').textContent = 'Vor der ersten Anmeldung muss ein Passwort auf dem Server eingerichtet werden.';
}).catch(error => $('#login-message').textContent = error.message);
