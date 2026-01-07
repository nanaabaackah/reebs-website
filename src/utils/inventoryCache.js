const INVENTORY_CACHE_KEY = "reebs_inventory_cache_v1";
const INVENTORY_CACHE_TTL = 5 * 60 * 1000;

const normalizeSource = (item) =>
  (item?.sourceCategoryCode || item?.sourcecategorycode || "")
    .toString()
    .trim()
    .toLowerCase();

export const readInventoryCache = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(INVENTORY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.items || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > INVENTORY_CACHE_TTL) return null;
    return parsed.items;
  } catch {
    return null;
  }
};

export const writeInventoryCache = (items) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      INVENTORY_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items })
    );
  } catch {
    // ignore cache write failures
  }
};

export const fetchInventoryWithCache = async ({ signal } = {}) => {
  const cached = readInventoryCache();
  if (cached) {
    return { items: cached, cached: true };
  }

  const response = await fetch("/.netlify/functions/inventory", { signal });
  if (!response.ok) {
    throw new Error(`Inventory request failed: ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : [];
  writeInventoryCache(items);
  return { items, cached: false };
};

export const splitInventory = (items = []) => {
  const rentals = [];
  const products = [];

  for (const item of items) {
    const source = normalizeSource(item);
    const isRental = source
      ? source === "rental"
      : (item?.sku || "").toString().toUpperCase().startsWith("REN");
    if (isRental) {
      rentals.push(item);
    } else {
      products.push(item);
    }
  }

  return { rentals, products };
};
