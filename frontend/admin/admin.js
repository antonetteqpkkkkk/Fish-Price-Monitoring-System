const API_BASE = window.API_BASE || '';

// Admin page script.
// Uses JWT auth:
// - POST /api/admin/login returns a token
// - token is stored in sessionStorage and sent as Authorization: Bearer <token>
// - CRUD endpoints live under /api/fish-prices

const loginCard = document.getElementById('loginCard');
const adminPanel = document.getElementById('adminPanel');
const loginStatus = document.getElementById('loginStatus');
const adminStatus = document.getElementById('adminStatus');
const logoutBtn = document.getElementById('logoutBtn');

const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');

const idEl = document.getElementById('id');
const fishTypeEl = document.getElementById('fish_type');
const minEl = document.getElementById('min_price');
const maxEl = document.getElementById('max_price');
const avgEl = document.getElementById('avg_price');
const dateEl = document.getElementById('date_updated');

const rowsEl = document.getElementById('rows');

let demoMode = false;

function setLoginStatus(msg) {
  loginStatus.textContent = msg || '';
}

function syncPasswordToggleLabel() {
  if (!togglePasswordBtn) return;
  togglePasswordBtn.textContent = passwordEl.type === 'password' ? 'Show' : 'Hide';
}

function setAdminStatus(msg) {
  adminStatus.textContent = msg || '';
}

function getToken() {
  // Session-only storage:
  // - safer than localStorage for an MVP (clears when tab closes)
  // - simple mental model for demos (log in per session)
  return sessionStorage.getItem('adminToken');
}

function setToken(t) {
  if (t) sessionStorage.setItem('adminToken', t);
  else sessionStorage.removeItem('adminToken');
}

async function api(path, options = {}) {
  // Fetch wrapper that:
  // - attaches JSON headers
  // - attaches Authorization header when logged in
  // - throws readable errors when requests fail
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) {
    const msg = body && body.message ? body.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

function showAdmin(isAuthed) {
  // Toggle between login form and admin panel.
  loginCard.classList.toggle('d-none', isAuthed);
  adminPanel.classList.toggle('d-none', !isAuthed);
  logoutBtn.classList.toggle('d-none', !isAuthed);
}

function clearForm() {
  idEl.value = '';
  fishTypeEl.value = '';
  minEl.value = '';
  maxEl.value = '';
  avgEl.value = '';
  dateEl.value = '';
}

function fillForm(row) {
  idEl.value = row.id;
  fishTypeEl.value = row.fish_type;
  minEl.value = row.min_price;
  maxEl.value = row.max_price;
  avgEl.value = row.avg_price;
  dateEl.value = row.date_updated;
}

function parsePayload() {
  // Build the request body for create/update.
  const payload = {
    fish_type: fishTypeEl.value.trim(),
    min_price: Number(minEl.value),
    max_price: Number(maxEl.value),
    avg_price: Number(avgEl.value),
  };

  if (dateEl.value) payload.date_updated = dateEl.value;
  return payload;
}

async function refreshTable() {
  // Pulls the latest "latest per fish" list and renders it as an HTML table.
  setAdminStatus('Loading…');
  const rows = await api('/api/fish-prices');

  rowsEl.innerHTML = rows
    .map(
      (r) => `
      <tr data-id="${r.id}" class="row-click">
        <td>${r.id}</td>
        <td>${r.fish_type}</td>
        <td>${r.min_price}</td>
        <td>${r.max_price}</td>
        <td>${r.avg_price}</td>
        <td>${r.date_updated}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm" data-del="${r.id}">Delete</button>
        </td>
      </tr>`
    )
    .join('');

  setAdminStatus('');
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  // Login -> store token -> show admin panel -> load table.
  setLoginStatus('Logging in…');
  try {
    const r = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameEl.value.trim(), password: passwordEl.value }),
    });
    setToken(r.token);
    demoMode = !!r.demoMode;
    showAdmin(true);
    clearForm();
    await refreshTable();
    setLoginStatus('');
  } catch (e) {
    setToken(null);
    showAdmin(false);
    // If demoMode is detected, show the demo credential hint to reduce confusion.
    setLoginStatus(demoMode ? 'Access denied. (Demo creds: admin / admin123)' : 'Access denied.');
  }
});

if (togglePasswordBtn) {
  syncPasswordToggleLabel();
  togglePasswordBtn.addEventListener('click', () => {
    passwordEl.type = passwordEl.type === 'password' ? 'text' : 'password';
    syncPasswordToggleLabel();
    passwordEl.focus();
  });
}

logoutBtn.addEventListener('click', () => {
  // Clears the JWT and returns to the login view.
  setToken(null);
  showAdmin(false);
  setAdminStatus('');
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  refreshTable().catch((e) => setAdminStatus(e.message));
});

document.getElementById('clearBtn').addEventListener('click', () => {
  clearForm();
});

document.getElementById('createBtn').addEventListener('click', async () => {
  // Create a new fish price entry (admin only).
  try {
    setAdminStatus('Saving…');
    await api('/api/fish-prices', { method: 'POST', body: JSON.stringify(parsePayload()) });
    clearForm();
    await refreshTable();
    setAdminStatus('Saved.');
  } catch (e) {
    setAdminStatus(e.message);
  }
});

document.getElementById('updateBtn').addEventListener('click', async () => {
  // Update an existing entry by ID (admin only).
  const id = Number(idEl.value);
  if (!Number.isFinite(id) || id <= 0) {
    setAdminStatus('Enter a valid ID to update.');
    return;
  }

  try {
    setAdminStatus('Updating…');
    await api(`/api/fish-prices/${id}`, { method: 'PUT', body: JSON.stringify(parsePayload()) });
    clearForm();
    await refreshTable();
    setAdminStatus('Updated.');
  } catch (e) {
    setAdminStatus(e.message);
  }
});

rowsEl.addEventListener('click', async (e) => {
  // Table click behavior:
  // - clicking Delete triggers DELETE
  // - clicking a row loads that row into the form for editing
  const delId = e.target?.dataset?.del;
  if (delId) {
    if (!confirm('Delete this record?')) return;
    try {
      setAdminStatus('Deleting…');
      await api(`/api/fish-prices/${delId}`, { method: 'DELETE' });
      await refreshTable();
      setAdminStatus('Deleted.');
    } catch (err) {
      setAdminStatus(err.message);
    }
    return;
  }

  const tr = e.target.closest('tr');
  if (!tr) return;
  const id = tr.getAttribute('data-id');
  if (!id) return;

  // Fetch latest list row and load into form
  try {
    const rows = await api('/api/fish-prices');
    const row = rows.find((r) => String(r.id) === String(id));
    if (row) fillForm(row);
  } catch {
    // ignore
  }
});

// Auto-show admin if token exists
showAdmin(!!getToken());
if (getToken()) {
  refreshTable().catch(() => {
    setToken(null);
    showAdmin(false);
  });
}

// Show helpful login hint for demo mode
(async () => {
  try {
    const health = await api('/api/health', { method: 'GET' });
    demoMode = !!health.demoMode;
    if (demoMode) {
      setLoginStatus('Demo mode detected. Login: admin / admin123');
    }
  } catch {
    // ignore; backend may be offline
  }
})();
