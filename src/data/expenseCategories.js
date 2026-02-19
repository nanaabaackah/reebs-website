export const EXPENSE_CATEGORIES = Object.freeze([
  { label: "Rent & Utilities", chipBg: "rgba(255, 122, 89, 0.2)", chipColor: "#7a2f1d" },
  { label: "Payroll & Staff Costs", chipBg: "rgba(74, 180, 255, 0.2)", chipColor: "#1f5c8e" },
  { label: "Transport & Fuel", chipBg: "rgba(99, 231, 198, 0.22)", chipColor: "#0f6f56" },
  { label: "Marketing & Advertising", chipBg: "rgba(255, 215, 96, 0.3)", chipColor: "#8f6500" },
  { label: "Repairs & Maintenance", chipBg: "rgba(160, 113, 255, 0.24)", chipColor: "#50308a" },
  { label: "Office & Admin", chipBg: "rgba(121, 143, 255, 0.2)", chipColor: "#2b3c86" },
  { label: "Communication & Internet", chipBg: "rgba(118, 220, 112, 0.22)", chipColor: "#2d6a2a" },
  { label: "Professional & Legal Fees", chipBg: "rgba(255, 153, 170, 0.23)", chipColor: "#8d3247" },
  { label: "Bank Charges & Mobile Money Fees", chipBg: "rgba(144, 188, 255, 0.22)", chipColor: "#285288" },
  { label: "Taxes, Levies & Licences", chipBg: "rgba(255, 171, 108, 0.24)", chipColor: "#7f3e18" },
  { label: "Insurance", chipBg: "rgba(169, 235, 255, 0.25)", chipColor: "#1e5a73" },
  { label: "Miscellaneous", chipBg: "rgba(180, 184, 200, 0.26)", chipColor: "#4b4f62" },
]);

const CATEGORY_ALIASES = {
  Logistics: "Transport & Fuel",
  Operational: "Office & Admin",
  Payroll: "Payroll & Staff Costs",
  Marketing: "Marketing & Advertising",
  Maintenance: "Repairs & Maintenance",
  Transport: "Transport & Fuel",
  Utilities: "Rent & Utilities",
  "Bank Charges": "Bank Charges & Mobile Money Fees",
};

const CATEGORY_RULES = [
  { category: "Rent & Utilities", keywords: ["rent", "lease", "water", "electricity", "ecg", "utility"] },
  { category: "Payroll & Staff Costs", keywords: ["salary", "payroll", "wage", "staff", "allowance", "ssnit"] },
  { category: "Transport & Fuel", keywords: ["fuel", "transport", "uber", "bolt", "delivery", "toll"] },
  {
    category: "Marketing & Advertising",
    keywords: ["marketing", "promo", "advert", "campaign", "facebook", "instagram", "tiktok", "seo"],
  },
  { category: "Repairs & Maintenance", keywords: ["maintenance", "repair", "service", "spare", "technician"] },
  { category: "Office & Admin", keywords: ["office", "stationery", "printer", "supplies", "admin"] },
  { category: "Communication & Internet", keywords: ["internet", "wifi", "airtime", "data", "telecom", "phone"] },
  {
    category: "Professional & Legal Fees",
    keywords: ["legal", "lawyer", "consultant", "professional", "audit", "accountant", "advisory"],
  },
  {
    category: "Bank Charges & Mobile Money Fees",
    keywords: ["bank", "charge", "fee", "momo", "mobile money", "transfer", "merchant fee"],
  },
  { category: "Taxes, Levies & Licences", keywords: ["tax", "vat", "gra", "permit", "license", "licence", "levy"] },
  { category: "Insurance", keywords: ["insurance", "premium", "policy", "cover"] },
];

const normalizeKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const CATEGORY_LOOKUP = new Map(EXPENSE_CATEGORIES.map((item) => [normalizeKey(item.label), item.label]));
Object.entries(CATEGORY_ALIASES).forEach(([alias, canonical]) => {
  CATEGORY_LOOKUP.set(normalizeKey(alias), canonical);
});

const STYLE_LOOKUP = new Map(EXPENSE_CATEGORIES.map((item) => [item.label, {
  background: item.chipBg,
  color: item.chipColor,
}]));

export const EXPENSE_CATEGORY_LABELS = Object.freeze(EXPENSE_CATEGORIES.map((item) => item.label));

export const normalizeExpenseCategory = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return CATEGORY_LOOKUP.get(normalizeKey(raw)) || raw;
};

export const inferExpenseCategory = ({ category = "", description = "" } = {}) => {
  const normalized = normalizeExpenseCategory(category);
  if (EXPENSE_CATEGORY_LABELS.includes(normalized)) return normalized;
  const text = `${category || ""} ${description || ""}`.toLowerCase();
  const matched = CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));
  return matched?.category || "Miscellaneous";
};

export const getExpenseCategoryStyle = (category) => {
  const normalized = normalizeExpenseCategory(category);
  return (
    STYLE_LOOKUP.get(normalized) || {
      background: "rgba(180, 184, 200, 0.26)",
      color: "#4b4f62",
    }
  );
};

