const API_BASE = window.API_BASE || '';

// Public page script.
// Flow:
// 1) Load fish types from the backend.
// 2) When a fish is selected, fetch the latest price row.
// 3) If the backend is unreachable, fall back to sample data so the UI still demonstrates behavior.

// Simple demo data (used only if the backend is unreachable)
const MOCK_ROWS = [
  {
    id: 1,
    fish_type: 'Galunggong',
    min_price: 120,
    max_price: 160,
    avg_price: 140,
    date_updated: '2026-01-22',
  },
  {
    id: 2,
    fish_type: 'Tamban',
    min_price: 80,
    max_price: 110,
    avg_price: 95,
    date_updated: '2026-01-22',
  },
];

const MOCK_BY_TYPE = new Map(MOCK_ROWS.map((r) => [r.fish_type, r]));
let usingMock = false;

const fishSelect = document.getElementById('fishSelect');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const minPriceEl = document.getElementById('minPrice');
const maxPriceEl = document.getElementById('maxPrice');
const avgPriceEl = document.getElementById('avgPrice');
const lastUpdatedEl = document.getElementById('lastUpdated');

function money(v) {
  // Format a number as Philippine Peso.
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `₱${n.toFixed(2)}`;
}

function setStatus(msg) {
  statusEl.textContent = msg || '';
}

async function apiGet(path) {
  // Minimal JSON fetch wrapper.
  // NOTE: API_BASE is injected at build time for Netlify (or empty for local same-origin).
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function loadFishTypes() {
  setStatus('Loading fish types…');
  fishSelect.innerHTML = '';

  let fishTypes;
  try {
    fishTypes = await apiGet('/api/fish-types');
  } catch {
    try {
      // fallback: derive from /api/fish-prices
      const rows = await apiGet('/api/fish-prices');
      fishTypes = Array.from(new Set(rows.map((r) => r.fish_type))).sort();
    } catch {
      // final fallback: mock data
      usingMock = true;
      fishTypes = Array.from(MOCK_BY_TYPE.keys()).sort();
    }
  }

  if (!fishTypes.length) {
    fishSelect.innerHTML = '<option value="">No data yet</option>';
    setStatus('No fish prices found.');
    return;
  }

  fishSelect.innerHTML = fishTypes
    .map((t) => `<option value="${encodeURIComponent(t)}">${t}</option>`)
    .join('');

  setStatus(usingMock ? 'Showing sample data (backend not connected yet).' : '');
  // Load the first fish type immediately.
  await loadFishPrice(decodeURIComponent(fishSelect.value));
}

async function loadFishPrice(fishType) {
  if (!fishType) return;
  setStatus(usingMock ? 'Showing sample data.' : 'Fetching latest prices…');
  resultEl.classList.add('d-none');

  let row;
  try {
    row = await apiGet(`/api/fish-prices/${encodeURIComponent(fishType)}`);
  } catch {
    usingMock = true;
    row = MOCK_BY_TYPE.get(fishType);
    if (!row) {
      setStatus('No sample data for this fish type.');
      return;
    }
  }
  minPriceEl.textContent = money(row.min_price);
  maxPriceEl.textContent = money(row.max_price);
  avgPriceEl.textContent = money(row.avg_price);
  lastUpdatedEl.textContent = row.date_updated;

  resultEl.classList.remove('d-none');
  setStatus(usingMock ? 'Showing sample data (backend not connected yet).' : '');
}

fishSelect.addEventListener('change', async () => {
  // On selection change, re-fetch and re-render the price card.
  const fishType = decodeURIComponent(fishSelect.value);
  try {
    await loadFishPrice(fishType);
  } catch (e) {
    setStatus('Failed to load price.');
  }
});

// Initial page load.
loadFishTypes().catch(() => {
  usingMock = true;
  setStatus('Showing sample data (backend not connected yet).');
});
