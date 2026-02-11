// Demo-mode data store.
// Used when DATABASE_URL is not set (non-production only).
// This data is in-memory and will reset when the server restarts.

const demoRows = [
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

let rows = [...demoRows];
let nextId = Math.max(...rows.map((r) => r.id), 0) + 1;

function toIsoDate(value) {
  // Keep demo-mode dates consistent with the DB shape (YYYY-MM-DD).
  if (!value) return new Date().toISOString().slice(0, 10);

  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }

  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function listLatestByType() {
  const latest = new Map();
  for (const row of rows) {
    const key = String(row.fish_type);
    const prev = latest.get(key);
    if (!prev) {
      latest.set(key, row);
      continue;
    }

    const prevDate = new Date(prev.date_updated).getTime();
    const rowDate = new Date(row.date_updated).getTime();
    if (rowDate > prevDate || (rowDate === prevDate && row.id > prev.id)) {
      latest.set(key, row);
    }
  }

  return Array.from(latest.values()).sort((a, b) => String(a.fish_type).localeCompare(String(b.fish_type)));
}

function listFishTypes() {
  return Array.from(new Set(rows.map((r) => r.fish_type))).sort((a, b) => String(a).localeCompare(String(b)));
}

function getLatestByFishType(fishType) {
  const matches = rows
    .filter((r) => String(r.fish_type) === String(fishType))
    .sort((a, b) => {
      const ad = new Date(a.date_updated).getTime();
      const bd = new Date(b.date_updated).getTime();
      if (ad !== bd) return bd - ad;
      return b.id - a.id;
    });

  return matches[0] || null;
}

function create(row) {
  const newRow = {
    id: nextId++,
    fish_type: String(row.fish_type).trim(),
    min_price: Number(row.min_price),
    max_price: Number(row.max_price),
    avg_price: Number(row.avg_price),
    date_updated: toIsoDate(row.date_updated),
  };
  rows.push(newRow);
  return newRow;
}

function update(id, row) {
  const idx = rows.findIndex((r) => Number(r.id) === Number(id));
  if (idx === -1) return null;

  const updated = {
    ...rows[idx],
    fish_type: String(row.fish_type).trim(),
    min_price: Number(row.min_price),
    max_price: Number(row.max_price),
    avg_price: Number(row.avg_price),
    date_updated: row.date_updated ? toIsoDate(row.date_updated) : rows[idx].date_updated,
  };

  rows[idx] = updated;
  return updated;
}

function remove(id) {
  const idx = rows.findIndex((r) => Number(r.id) === Number(id));
  if (idx === -1) return false;
  rows.splice(idx, 1);
  return true;
}

module.exports = {
  listLatestByType,
  listFishTypes,
  getLatestByFishType,
  create,
  update,
  remove,
};
