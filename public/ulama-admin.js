const ACCESS_KEY = 'rd_token';
const REFRESH_KEY = 'rd_refresh';
const DEFAULT_API_BASE = 'https://deeds-backend.vercel.app';

const refs = {
  form: document.getElementById('advice-form'),
  title: document.getElementById('form-title'),
  saveBtn: document.getElementById('save-btn'),
  cancelEdit: document.getElementById('cancel-edit'),
  list: document.getElementById('list'),
  count: document.getElementById('count'),
  status: document.getElementById('status'),
  loadDefaults: document.getElementById('load-defaults'),
  exportJson: document.getElementById('export-json'),
  importTrigger: document.getElementById('import-json-trigger'),
  importInput: document.getElementById('import-json'),
  clearAll: document.getElementById('clear-all'),
  template: document.getElementById('item-template'),
  scholar: document.getElementById('scholar'),
  work: document.getElementById('work'),
  advice: document.getElementById('advice'),
  action: document.getElementById('action'),
  source: document.getElementById('source'),
};

const queryApiBase = new URLSearchParams(window.location.search).get('api');
const API_BASE = (queryApiBase || '').trim()
  || localStorage.getItem('ramadan_api_base')
  || (window.location.hostname === 'localhost' ? 'http://localhost:4000' : DEFAULT_API_BASE);

let adviceList = [];
let defaultList = [];
let editingId = null;

function getToken() {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function sanitizeItem(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const scholar = String(raw.scholar || '').trim();
  const work = String(raw.work || '').trim();
  const advice = String(raw.advice || '').trim();
  const action = String(raw.action || '').trim();
  const source = String(raw.source || '').trim();
  if (!scholar || !advice || !action) return null;

  const baseId = String(raw.id || '').trim() || `${slugify(scholar)}-${index + 1}`;
  return {
    id: baseId || `ulama-${Date.now()}-${index}`,
    scholar,
    work: work || "Noma'lum manba",
    advice,
    action,
    source: source || '#',
  };
}

function sanitizeList(list, fallback = []) {
  const source = Array.isArray(list) ? list : fallback;
  const seen = new Set();
  return source
    .map((item, index) => sanitizeItem(item, index))
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

function setStatus(message, type = 'success') {
  if (!refs.status) return;
  refs.status.textContent = message;
  refs.status.className = `status show ${type}`;
}

function clearStatus() {
  if (!refs.status) return;
  refs.status.textContent = '';
  refs.status.className = 'status';
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const payload = await response.json();
    setTokens(payload.access_token, payload.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function apiReq(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  if (response.status === 401 && !options._retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiReq(path, { ...options, _retry: true });
    throw new Error("Auth token topilmadi yoki eskirgan. Avval ilovada qayta login qiling.");
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || 'Server xatosi');
  }
  return json;
}

function clearForm() {
  refs.form.reset();
  editingId = null;
  refs.title.textContent = "Yangi nasihat qo'shish";
  refs.saveBtn.textContent = 'Saqlash';
  refs.cancelEdit.hidden = true;
}

function startEdit(item) {
  editingId = item.id;
  refs.title.textContent = "Nasihatni tahrirlash";
  refs.saveBtn.textContent = 'Yangilash';
  refs.cancelEdit.hidden = false;
  refs.scholar.value = item.scholar;
  refs.work.value = item.work;
  refs.advice.value = item.advice;
  refs.action.value = item.action;
  refs.source.value = item.source;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderList() {
  refs.list.innerHTML = '';
  refs.count.textContent = `${adviceList.length} ta`;

  if (adviceList.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = "Hozircha nasihat yo'q. Yuqoridagi formadan qo'shing.";
    refs.list.appendChild(empty);
    return;
  }

  adviceList.forEach((item) => {
    const node = refs.template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-field="scholar"]').textContent = item.scholar;
    node.querySelector('[data-field="work"]').textContent = item.work;
    node.querySelector('[data-field="advice"]').textContent = item.advice;
    node.querySelector('[data-field="action"]').textContent = item.action;

    const link = node.querySelector('[data-field="source"]');
    link.href = item.source;
    link.textContent = "Manbani ko'rish";

    node.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(item));
    node.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm("Ushbu nasihat o'chirilsinmi?")) return;
      const prev = [...adviceList];
      adviceList = adviceList.filter((row) => row.id !== item.id);
      if (editingId === item.id) clearForm();
      renderList();
      try {
        await saveToServer();
        setStatus("Nasihat o'chirildi va serverga saqlandi.");
      } catch (err) {
        adviceList = prev;
        renderList();
        setStatus(err.message, 'error');
      }
    });

    refs.list.appendChild(node);
  });
}

function buildItemFromForm() {
  return sanitizeItem({
    id: editingId || `${slugify(refs.scholar.value)}-${Date.now()}`,
    scholar: refs.scholar.value,
    work: refs.work.value,
    advice: refs.advice.value,
    action: refs.action.value,
    source: refs.source.value,
  });
}

async function loadDefaults() {
  try {
    const response = await fetch('/ulama-advice.defaults.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('defaults_not_found');
    const payload = await response.json();
    defaultList = sanitizeList(payload);
  } catch {
    defaultList = [];
  }
}

async function loadFromServer() {
  const payload = await apiReq('/api/nafs/ulama');
  adviceList = sanitizeList(payload, defaultList);
  renderList();
}

async function saveToServer() {
  const payload = await apiReq('/api/nafs/ulama', {
    method: 'PUT',
    body: { items: adviceList },
  });
  adviceList = sanitizeList(payload?.items, adviceList);
  renderList();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(adviceList, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ulama-advice.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result || '[]'));
      const imported = sanitizeList(parsed);
      if (imported.length === 0) {
        setStatus("JSON ichida yaroqli nasihatlar topilmadi.", 'error');
        return;
      }
      const prev = [...adviceList];
      adviceList = imported;
      renderList();
      try {
        await saveToServer();
        clearForm();
        setStatus('Import serverga saqlandi.');
      } catch (err) {
        adviceList = prev;
        renderList();
        setStatus(err.message, 'error');
      }
    } catch {
      setStatus("JSON formatini o'qib bo'lmadi.", 'error');
    }
  };
  reader.readAsText(file);
}

refs.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();

  const nextItem = buildItemFromForm();
  if (!nextItem) {
    setStatus("Majburiy maydonlarni to'ldiring.", 'error');
    return;
  }

  const prev = [...adviceList];
  if (editingId) {
    adviceList = adviceList.map((item) => (item.id === editingId ? nextItem : item));
  } else {
    adviceList = [nextItem, ...adviceList];
  }
  renderList();

  try {
    await saveToServer();
    clearForm();
    setStatus('Serverga saqlandi.');
  } catch (err) {
    adviceList = prev;
    renderList();
    setStatus(err.message, 'error');
  }
});

refs.cancelEdit.addEventListener('click', () => clearForm());

refs.loadDefaults.addEventListener('click', async () => {
  clearStatus();
  if (!defaultList.length) {
    setStatus("Standart ro'yxat topilmadi.", 'error');
    return;
  }
  if (!confirm('Standart nasihatlar bilan almashtirilsinmi?')) return;

  const prev = [...adviceList];
  adviceList = [...defaultList];
  renderList();

  try {
    await saveToServer();
    clearForm();
    setStatus('Standart nasihatlar serverga yozildi.');
  } catch (err) {
    adviceList = prev;
    renderList();
    setStatus(err.message, 'error');
  }
});

refs.exportJson.addEventListener('click', exportJson);

refs.importTrigger.addEventListener('click', () => refs.importInput.click());

refs.importInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  importJson(file);
  refs.importInput.value = '';
});

refs.clearAll.addEventListener('click', async () => {
  clearStatus();
  if (!confirm("Barcha nasihatlar o'chirilsinmi?")) return;

  const prev = [...adviceList];
  adviceList = [];
  renderList();
  try {
    await saveToServer();
    clearForm();
    setStatus("Barcha nasihatlar o'chirildi.");
  } catch (err) {
    adviceList = prev;
    renderList();
    setStatus(err.message, 'error');
  }
});

(async function init() {
  await loadDefaults();

  if (!getToken()) {
    setStatus("Token topilmadi. Avval ilovada login qiling.", 'error');
  }

  try {
    await loadFromServer();
    setStatus('Serverdan muvaffaqiyatli yuklandi.');
  } catch (err) {
    adviceList = [...defaultList];
    renderList();
    setStatus(err.message, 'error');
  }
})();
