const cache = new Map();

// Tiny in-memory cache used to reduce repeated DB reads.
// This is intentionally simple (no persistence, cleared on server restart).

function nowMs() {
  return Date.now();
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < nowMs()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: nowMs() + ttlMs });
}

function invalidatePrefix(prefix) {
  // Convenience invalidation for related keys after a write.
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

module.exports = { getCached, setCached, invalidatePrefix };
