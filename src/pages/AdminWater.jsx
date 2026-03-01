import React, { useEffect, useMemo, useState } from "react";
import { AppIcon } from "/src/components/Icon";
import {
  faBoxesStacked,
  faChartLine,
  faMinus,
  faMoneyCheckDollar,
  faPlus,
  faReceipt,
  faRotateRight,
  faStore,
} from "/src/icons/iconSet";
import AdminBreadcrumb from "../components/AdminBreadcrumb";
import "../styles/admin.css";

const DEFAULT_PURCHASE_COST = 2200;
const DEFAULT_RETAIL_PRICE = 2700;
const DEFAULT_BULK_PRICE = 2600;
const DEFAULT_COMPANY_PRICE = 2500;
const DEFAULT_BULK_THRESHOLD = 10;
const SALE_QUICK_QUANTITIES = [1, 5, 10, 20];
const ADJUSTMENT_QUICK_QUANTITIES = [1, 3, 5, 10];
const EXPENSE_QUICK_AMOUNTS = [5, 10, 20, 50];
const CUSTOM_EXPENSE_CATEGORY = "__custom__";
const CUSTOM_ADJUSTMENT_REASON = "__custom__";
const SALE_PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "momo", label: "MoMo" },
  { value: "credit", label: "Pay later" },
];
const EXPENSE_CATEGORY_OPTIONS = ["Transport", "Labour", "Promo", "Supplies"];
const ADJUSTMENT_REASON_OPTIONS = {
  add: ["Count gain", "Returned packs", "Found stock"],
  remove: ["Breakage", "Spoilage", "Free issue"],
};

const buildDefaultDashboard = () => ({
  product: {
    key: "gwater-12pk",
    name: "12pk Gwater",
    purchaseCost: DEFAULT_PURCHASE_COST,
    pricing: {
      retailSingle: DEFAULT_RETAIL_PRICE,
      retailBulk: DEFAULT_BULK_PRICE,
      company: DEFAULT_COMPANY_PRICE,
      bulkThreshold: DEFAULT_BULK_THRESHOLD,
    },
  },
  summary: {
    stockOnHand: 0,
    unitsRestocked: 0,
    unitsSold: 0,
    adjustmentUnits: 0,
    revenue: 0,
    restockSpend: 0,
    extraExpenses: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    netProfit: 0,
    cashCollected: 0,
    outstandingCredit: 0,
    cashPosition: 0,
    inventoryValue: 0,
  },
  restocks: [],
  sales: [],
  expenses: [],
  adjustments: [],
});

const todayValue = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((Number(amount) || 0) / 100);
  } catch {
    return `GHS ${((Number(amount) || 0) / 100).toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCustomerName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getPreviewUnitPrice = (quantity, pricing, saleChannel) => {
  if (saleChannel === "company") return pricing.company;
  return quantity >= pricing.bulkThreshold ? pricing.retailBulk : pricing.retailSingle;
};

const normalizeSalePaymentMethod = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "momo") return "momo";
  if (normalized === "credit") return "credit";
  return "cash";
};

const getSalePaymentLabel = (value) => {
  const normalized = normalizeSalePaymentMethod(value);
  if (normalized === "momo") return "MoMo";
  if (normalized === "credit") return "Pay later";
  return "Cash";
};

function AdminWater() {
  const [dashboard, setDashboard] = useState(buildDefaultDashboard);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [vendorError, setVendorError] = useState("");
  const [customerError, setCustomerError] = useState("");

  const [restockForm, setRestockForm] = useState({
    quantity: "",
    vendorId: "",
    vendorName: "",
    date: todayValue(),
    notes: "",
  });
  const [saleForm, setSaleForm] = useState({
    quantity: "",
    saleChannel: "retail",
    paymentMethod: "cash",
    customerId: "",
    customerName: "",
    date: todayValue(),
    notes: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    customCategory: "",
    amount: "",
    description: "",
    date: todayValue(),
    notes: "",
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    mode: "remove",
    quantityDelta: "",
    reason: "",
    customReason: "",
    date: todayValue(),
    notes: "",
  });

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const loadWater = async () => {
    const response = await fetch("/.netlify/functions/water");
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || "Failed to load the water module.");
    }
    setDashboard(data && typeof data === "object" ? data : buildDefaultDashboard());
  };

  const loadVendors = async () => {
    setVendorError("");
    try {
      const response = await fetch("/.netlify/functions/vendors");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load vendors.");
      }
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Water vendor load failed", err);
      setVendorError(err.message || "Vendor list is unavailable right now.");
      setVendors([]);
    }
  };

  const loadCustomers = async () => {
    setCustomerError("");
    try {
      const response = await fetch("/.netlify/functions/customers");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load customers.");
      }
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Water customer load failed", err);
      setCustomerError(err.message || "Customer list is unavailable right now.");
      setCustomers([]);
    }
  };

  const loadModule = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadWater(), loadVendors(), loadCustomers()]);
    } catch (err) {
      console.error("Water module load failed", err);
      setError(err.message || "Unable to load the water module.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModule();
  }, []);

  const handleAction = async (action, payload, successMessage) => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/.netlify/functions/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save water module activity.");
      }
      setDashboard(data && typeof data === "object" ? data : buildDefaultDashboard());
      setStatus(successMessage);
      return true;
    } catch (err) {
      console.error("Water action failed", err);
      setError(err.message || "Unable to save water module activity.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const pricing = dashboard?.product?.pricing || buildDefaultDashboard().product.pricing;
  const summary = dashboard?.summary || buildDefaultDashboard().summary;
  const restocks = Array.isArray(dashboard?.restocks) ? dashboard.restocks : [];
  const sales = Array.isArray(dashboard?.sales) ? dashboard.sales : [];
  const expenses = Array.isArray(dashboard?.expenses) ? dashboard.expenses : [];
  const adjustments = Array.isArray(dashboard?.adjustments) ? dashboard.adjustments : [];

  const salePreview = useMemo(() => {
    const quantity = Math.max(0, Math.round(toNumber(saleForm.quantity, 0)));
    const unitPrice = getPreviewUnitPrice(quantity, pricing, saleForm.saleChannel);
    return {
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };
  }, [pricing, saleForm.quantity, saleForm.saleChannel]);

  const stockTimeline = useMemo(() => {
    const restockRows = restocks.map((item) => ({
      id: `restock-${item.id}`,
      type: "restock",
      label: "Restock",
      date: item.date,
      quantity: toNumber(item.quantity),
      detail: item.vendorName || "Unassigned vendor",
      note: item.notes || "",
      amount: toNumber(item.quantity) * toNumber(item.unitCost),
    }));
    const adjustmentRows = adjustments.map((item) => ({
      id: `adjustment-${item.id}`,
      type: "adjustment",
      label: "Correction",
      date: item.date,
      quantity: toNumber(item.quantityDelta),
      detail: item.reason || "Manual correction",
      note: item.notes || "",
      amount: null,
    }));
    return [...restockRows, ...adjustmentRows].sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });
  }, [adjustments, restocks]);

  const selectedVendor = useMemo(() => {
    const vendorId = Number(restockForm.vendorId);
    if (!Number.isFinite(vendorId) || vendorId <= 0) return null;
    return vendors.find((vendor) => vendor.id === vendorId) || null;
  }, [restockForm.vendorId, vendors]);

  const selectedSaleCustomer = useMemo(() => {
    const customerId = Number(saleForm.customerId);
    if (!Number.isFinite(customerId) || customerId <= 0) return null;
    return customers.find((customer) => customer.id === customerId) || null;
  }, [customers, saleForm.customerId]);
  const typedSaleCustomerName = saleForm.customerName.trim();
  const matchedTypedSaleCustomer = useMemo(() => {
    if (selectedSaleCustomer || !typedSaleCustomerName) return null;
    const normalizedName = normalizeCustomerName(typedSaleCustomerName);
    if (!normalizedName) return null;
    return (
      customers.find((customer) => normalizeCustomerName(customer.name) === normalizedName) || null
    );
  }, [customers, selectedSaleCustomer, typedSaleCustomerName]);

  const selectedVendorName = selectedVendor?.name || "";
  const restockCost = Math.max(0, Math.round(toNumber(restockForm.quantity, 0))) * DEFAULT_PURCHASE_COST;
  const saleCustomerLabel = saleForm.saleChannel === "company" ? "Company name" : "Customer name";
  const salePricingLabel =
    saleForm.saleChannel === "company"
      ? "Company rate"
      : salePreview.quantity >= pricing.bulkThreshold
        ? `Bulk retail (${pricing.bulkThreshold}+)`
        : `Retail under ${pricing.bulkThreshold}`;
  const salePaymentLabel = getSalePaymentLabel(saleForm.paymentMethod);
  const saleResolvedCustomerLabel = selectedSaleCustomer ? "Linked REEBS customer" : saleCustomerLabel;
  const resolvedExpenseCategory =
    expenseForm.category === CUSTOM_EXPENSE_CATEGORY
      ? expenseForm.customCategory.trim()
      : expenseForm.category.trim();
  const expenseAmountValue = Math.max(0, Number(expenseForm.amount) || 0);
  const expenseSummaryAmount = Math.round(expenseAmountValue * 100);
  const expenseSummaryLabel = resolvedExpenseCategory || "Expense";
  const adjustmentHasCustomReason = adjustmentForm.reason === CUSTOM_ADJUSTMENT_REASON;
  const resolvedAdjustmentReason = adjustmentHasCustomReason
    ? adjustmentForm.customReason.trim()
    : adjustmentForm.reason.trim();

  const setSaleQuantityValue = (nextValue) => {
    if (nextValue === "" || nextValue === null || nextValue === undefined) {
      setSaleForm((prev) => ({ ...prev, quantity: "" }));
      return;
    }
    const parsed = Math.round(toNumber(nextValue, 0));
    setSaleForm((prev) => ({
      ...prev,
      quantity: parsed <= 0 ? "" : String(parsed),
    }));
  };

  const adjustSaleQuantity = (delta) => {
    const current = Math.max(0, Math.round(toNumber(saleForm.quantity, 0)));
    const next = current + delta;
    setSaleQuantityValue(next <= 0 ? 1 : next);
  };

  const setExpenseAmountValue = (nextValue) => {
    if (nextValue === "" || nextValue === null || nextValue === undefined) {
      setExpenseForm((prev) => ({ ...prev, amount: "" }));
      return;
    }
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setExpenseForm((prev) => ({ ...prev, amount: "" }));
      return;
    }
    const normalized = Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
    setExpenseForm((prev) => ({ ...prev, amount: normalized }));
  };

  const adjustExpenseAmount = (delta) => {
    const current = Math.max(0, Number(expenseForm.amount) || 0);
    const next = current + delta;
    setExpenseAmountValue(next <= 0 ? 1 : Number(next.toFixed(2)));
  };

  const adjustmentQuantity = Math.max(0, Math.round(toNumber(adjustmentForm.quantityDelta, 0)));
  const adjustmentSignedQuantity =
    adjustmentForm.mode === "add" ? adjustmentQuantity : adjustmentQuantity * -1;
  const adjustmentReasonOptions = ADJUSTMENT_REASON_OPTIONS[adjustmentForm.mode] || [];
  const adjustmentSummaryLabel =
    adjustmentForm.mode === "add"
      ? `Add ${adjustmentQuantity || 0} pack${adjustmentQuantity === 1 ? "" : "s"} back to stock`
      : `Remove ${adjustmentQuantity || 0} pack${adjustmentQuantity === 1 ? "" : "s"} from stock`;

  const setAdjustmentQuantityValue = (nextValue) => {
    if (nextValue === "" || nextValue === null || nextValue === undefined) {
      setAdjustmentForm((prev) => ({ ...prev, quantityDelta: "" }));
      return;
    }
    const parsed = Math.round(toNumber(nextValue, 0));
    setAdjustmentForm((prev) => ({
      ...prev,
      quantityDelta: parsed <= 0 ? "" : String(parsed),
    }));
  };

  const adjustAdjustmentQuantity = (delta) => {
    const current = Math.max(0, Math.round(toNumber(adjustmentForm.quantityDelta, 0)));
    const next = current + delta;
    setAdjustmentQuantityValue(next <= 0 ? 1 : next);
  };

  const handleRestockSubmit = async (event) => {
    event.preventDefault();
    const saved = await handleAction(
      "restock",
      {
        quantity: restockForm.quantity,
        vendorId: restockForm.vendorId ? Number(restockForm.vendorId) : null,
        vendorName: selectedVendorName || restockForm.vendorName,
        date: restockForm.date,
        notes: restockForm.notes,
      },
      "Water stock updated."
    );
    if (saved) {
      setRestockForm({
        quantity: "",
        vendorId: "",
        vendorName: "",
        date: todayValue(),
        notes: "",
      });
    }
  };

  const handleSaleSubmit = async (event) => {
    event.preventDefault();
    const shouldRefreshCustomers = !saleForm.customerId && Boolean(saleForm.customerName.trim());
    const saved = await handleAction(
      "sale",
      {
        quantity: saleForm.quantity,
        saleChannel: saleForm.saleChannel,
        paymentMethod: saleForm.paymentMethod,
        customerId: saleForm.customerId ? Number(saleForm.customerId) : null,
        customerName: saleForm.customerName,
        date: saleForm.date,
        notes: saleForm.notes,
      },
      "Water sale recorded."
    );
    if (saved) {
      setSaleForm((prev) => ({
        ...prev,
        paymentMethod: "cash",
        customerId: "",
        quantity: "",
        customerName: "",
        date: todayValue(),
        notes: "",
      }));
      if (shouldRefreshCustomers) {
        await loadCustomers();
      }
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedExpenseCategory) {
      setError("Choose an expense category or add a custom one.");
      setStatus("");
      return;
    }
    const saved = await handleAction(
      "expense",
      {
        category: resolvedExpenseCategory,
        amount: expenseForm.amount,
        description: expenseForm.description.trim() || `${resolvedExpenseCategory} expense`,
        date: expenseForm.date,
        notes: expenseForm.notes,
      },
      "Water expense recorded."
    );
    if (saved) {
      setExpenseForm({
        category: "",
        customCategory: "",
        amount: "",
        description: "",
        date: todayValue(),
        notes: "",
      });
    }
  };

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedAdjustmentReason) {
      setError("Choose a stock correction reason or add a custom one.");
      setStatus("");
      return;
    }
    const saved = await handleAction(
      "adjustment",
      {
        quantityDelta: adjustmentSignedQuantity,
        reason: resolvedAdjustmentReason,
        date: adjustmentForm.date,
        notes: adjustmentForm.notes,
      },
      "Water stock correction saved."
    );
    if (saved) {
      setAdjustmentForm((prev) => ({
        ...prev,
        quantityDelta: "",
        reason: "",
        customReason: "",
        date: todayValue(),
        notes: "",
      }));
    }
  };

  return (
    <div className="water-module-page">
      <div className="water-module-shell">
        <AdminBreadcrumb items={[{ label: "Water" }]} />

        <header className="water-module-header">
          <div>
            <p className="water-module-eyebrow">External Operations Module</p>
            <h1>Water</h1>
            <p className="water-module-subtitle">
              Standalone sales, stock, and expense tracking for 12pk Gwater. Nothing here feeds
              into the main REEBS stock or sales ledgers.
            </p>
          </div>
          <button type="button" className="admin-secondary" onClick={loadModule} disabled={loading || saving}>
            <AppIcon icon={faRotateRight} /> Refresh
          </button>
        </header>

        {error && <p className="water-module-feedback water-module-feedback--error">{error}</p>}
        {status && <p className="water-module-feedback water-module-feedback--success">{status}</p>}

        <section className="water-module-hero">
          <div className="water-module-hero-copy">
            <span className="water-module-pill">Fixed product</span>
            <h2>{dashboard?.product?.name || "12pk Gwater"}</h2>
            <p>
              Purchase cost is fixed at {formatCurrency(dashboard?.product?.purchaseCost)} per pack.
              Retail pricing uses a 10+ bulk rule so quantities of {pricing.bulkThreshold} or more
              sell at the bulk rate.
            </p>
          </div>
          <div className="water-module-price-grid">
            <div className="water-module-price-card">
              <span>Retail under {pricing.bulkThreshold}</span>
              <strong>{formatCurrency(pricing.retailSingle)}</strong>
            </div>
            <div className="water-module-price-card">
              <span>Retail {pricing.bulkThreshold}+</span>
              <strong>{formatCurrency(pricing.retailBulk)}</strong>
            </div>
            <div className="water-module-price-card">
              <span>Company price</span>
              <strong>{formatCurrency(pricing.company)}</strong>
            </div>
          </div>
        </section>

        <section className="water-module-kpis">
          <article className="water-module-kpi">
            <p className="water-module-kpi-label">In stock</p>
            <div className="water-module-kpi-value">
              <AppIcon icon={faBoxesStacked} />
              <strong>{summary.stockOnHand}</strong>
            </div>
            <span>Inventory value {formatCurrency(summary.inventoryValue)}</span>
          </article>
          <article className="water-module-kpi">
            <p className="water-module-kpi-label">Revenue</p>
            <div className="water-module-kpi-value">
              <AppIcon icon={faReceipt} />
              <strong>{formatCurrency(summary.revenue)}</strong>
            </div>
            <span>
              {summary.unitsSold} packs sold, {formatCurrency(summary.cashCollected)} collected
            </span>
          </article>
          <article className="water-module-kpi">
            <p className="water-module-kpi-label">Gross profit</p>
            <div className="water-module-kpi-value">
              <AppIcon icon={faChartLine} />
              <strong>{formatCurrency(summary.grossProfit)}</strong>
            </div>
            <span>After {formatCurrency(summary.costOfGoodsSold)} COGS</span>
          </article>
          <article className="water-module-kpi">
            <p className="water-module-kpi-label">Cash position</p>
            <div className="water-module-kpi-value">
              <AppIcon icon={faMoneyCheckDollar} />
              <strong>{formatCurrency(summary.cashPosition)}</strong>
            </div>
            <span>{formatCurrency(summary.outstandingCredit)} still on credit</span>
          </article>
          <article className="water-module-kpi">
            <p className="water-module-kpi-label">Extra expenses</p>
            <div className="water-module-kpi-value">
              <AppIcon icon={faStore} />
              <strong>{formatCurrency(summary.extraExpenses)}</strong>
            </div>
            <span>Net profit {formatCurrency(summary.netProfit)}</span>
          </article>
        </section>

        <section className="water-module-grid">
          <article className="admin-card water-module-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Stock In</p>
                <h3>Restock Water</h3>
              </div>
              <span className="water-module-card-tag">Cost {formatCurrency(restockCost)}</span>
            </div>
            <form className="water-module-form" onSubmit={handleRestockSubmit}>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={restockForm.quantity}
                  onChange={(event) =>
                    setRestockForm((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Vendor from REEBS list
                <select
                  value={restockForm.vendorId}
                  onChange={(event) =>
                    setRestockForm((prev) => ({
                      ...prev,
                      vendorId: event.target.value,
                      vendorName: event.target.value ? "" : prev.vendorName,
                    }))
                  }
                >
                  <option value="">No linked vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
              {!restockForm.vendorId && (
                <label>
                  Custom vendor name
                  <input
                    type="text"
                    value={restockForm.vendorName}
                    onChange={(event) =>
                      setRestockForm((prev) => ({ ...prev, vendorName: event.target.value }))
                    }
                    placeholder="Optional"
                  />
                </label>
              )}
              <label>
                Date
                <input
                  type="date"
                  value={restockForm.date}
                  onChange={(event) =>
                    setRestockForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Notes
                <textarea
                  rows="3"
                  value={restockForm.notes}
                  onChange={(event) =>
                    setRestockForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Delivery batch, payment note, etc."
                />
              </label>
              {vendorError && <p className="water-module-inline-note">{vendorError}</p>}
              <button type="submit" className="admin-primary" disabled={saving}>
                <AppIcon icon={faPlus} /> {saving ? "Saving..." : "Add stock"}
              </button>
            </form>
          </article>

          <article className="admin-card water-module-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Sales</p>
                <h3>Quick Sale</h3>
              </div>
              <span className="water-module-card-tag">
                {salePreview.quantity > 0 ? formatCurrency(salePreview.total) : "Enter quantity"}
              </span>
            </div>
            <form className="water-module-form" onSubmit={handleSaleSubmit}>
              <div className="water-module-sale-block">
                <span className="water-module-field-label">Customer type</span>
                <div className="water-module-toggle-row" role="radiogroup" aria-label="Customer type">
                  <button
                    type="button"
                    className={`water-module-toggle-btn ${saleForm.saleChannel === "retail" ? "is-active" : ""}`}
                    onClick={() => setSaleForm((prev) => ({ ...prev, saleChannel: "retail" }))}
                    aria-pressed={saleForm.saleChannel === "retail"}
                  >
                    Retail
                  </button>
                  <button
                    type="button"
                    className={`water-module-toggle-btn ${saleForm.saleChannel === "company" ? "is-active" : ""}`}
                    onClick={() => setSaleForm((prev) => ({ ...prev, saleChannel: "company" }))}
                    aria-pressed={saleForm.saleChannel === "company"}
                  >
                    Company
                  </button>
                </div>
              </div>
              <div className="water-module-sale-block">
                <div className="water-module-inline-head">
                  <span className="water-module-field-label">Quantity</span>
                  <span className="water-module-inline-note">Tap a preset or adjust manually.</span>
                </div>
                <div className="water-module-quick-actions">
                  {SALE_QUICK_QUANTITIES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`water-module-quick-btn ${salePreview.quantity === value ? "is-active" : ""}`}
                      onClick={() => setSaleQuantityValue(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="water-module-stepper" aria-label="Sale quantity control">
                  <button
                    type="button"
                    className="water-module-stepper-btn"
                    onClick={() => adjustSaleQuantity(-1)}
                    aria-label="Reduce quantity"
                  >
                    <AppIcon icon={faMinus} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={saleForm.quantity}
                    onChange={(event) => setSaleQuantityValue(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="water-module-stepper-btn"
                    onClick={() => adjustSaleQuantity(1)}
                    aria-label="Increase quantity"
                  >
                    <AppIcon icon={faPlus} />
                  </button>
                </div>
              </div>
              <div className="water-module-sale-block">
                <div className="water-module-inline-head">
                  <span className="water-module-field-label">Payment</span>
                  <span className="water-module-inline-note">
                    Cash and MoMo count now. Pay later stays on credit.
                  </span>
                </div>
                <div className="water-module-quick-actions" role="radiogroup" aria-label="Payment method">
                  {SALE_PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`water-module-quick-btn ${
                        saleForm.paymentMethod === option.value ? "is-active" : ""
                      }`}
                      onClick={() =>
                        setSaleForm((prev) => ({
                          ...prev,
                          paymentMethod: option.value,
                        }))
                      }
                      aria-pressed={saleForm.paymentMethod === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="water-module-inline-summary">
                <span>
                  {salePricingLabel}: {formatCurrency(salePreview.unitPrice)} via {salePaymentLabel}
                </span>
                <strong>Total: {formatCurrency(salePreview.total)}</strong>
              </div>
              <details className="water-module-optional">
                <summary>Optional details</summary>
                <div className="water-module-optional-body">
                  <label>
                    Link REEBS customer
                    <select
                      value={saleForm.customerId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        const nextCustomer =
                          customers.find((customer) => String(customer.id) === nextId) || null;
                        setSaleForm((prev) => ({
                          ...prev,
                          customerId: nextId,
                          customerName: nextCustomer?.name || prev.customerName,
                        }));
                      }}
                    >
                      <option value="">No link</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedSaleCustomer && (
                    <p className="water-module-inline-note">
                      Linked to REEBS customer #{selectedSaleCustomer.id}.
                    </p>
                  )}
                  {customerError && !customers.length && (
                    <p className="water-module-inline-note">{customerError}</p>
                  )}
                  <label>
                    {saleResolvedCustomerLabel}
                    <input
                      type="text"
                      value={saleForm.customerName}
                      onChange={(event) =>
                        setSaleForm((prev) => ({ ...prev, customerName: event.target.value }))
                      }
                      placeholder={selectedSaleCustomer ? "Auto-filled from REEBS customer" : "Optional"}
                      disabled={Boolean(selectedSaleCustomer)}
                    />
                  </label>
                  {!selectedSaleCustomer && typedSaleCustomerName ? (
                    <p className="water-module-inline-note">
                      {matchedTypedSaleCustomer
                        ? `This matches REEBS customer #${matchedTypedSaleCustomer.id} and will link automatically when you save.`
                        : "This typed name will be added to the REEBS customer list when you save."}
                    </p>
                  ) : null}
                  <label>
                    Date
                    <input
                      type="date"
                      value={saleForm.date}
                      onChange={(event) =>
                        setSaleForm((prev) => ({ ...prev, date: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Notes
                    <textarea
                      rows="3"
                      value={saleForm.notes}
                      onChange={(event) =>
                        setSaleForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Optional delivery or account note"
                    />
                  </label>
                </div>
              </details>
              <button type="submit" className="admin-primary water-module-sale-submit" disabled={saving || loading}>
                <AppIcon icon={faReceipt} /> {saving ? "Saving..." : `Record ${formatCurrency(salePreview.total)}`}
              </button>
            </form>
          </article>

          <article className="admin-card water-module-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Expenses</p>
                <h3>Track Extras</h3>
              </div>
              <span className="water-module-card-tag">Separate from stock cost</span>
            </div>
            <form className="water-module-form" onSubmit={handleExpenseSubmit}>
              <div className="water-module-sale-block">
                <div className="water-module-inline-head">
                  <span className="water-module-field-label">Category</span>
                  <span className="water-module-inline-note">Pick a common expense type first.</span>
                </div>
                <div className="water-module-quick-actions">
                  {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`water-module-quick-btn ${expenseForm.category === category ? "is-active" : ""}`}
                      onClick={() =>
                        setExpenseForm((prev) => ({
                          ...prev,
                          category,
                          customCategory: "",
                        }))
                      }
                    >
                      {category}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`water-module-quick-btn ${
                      expenseForm.category === CUSTOM_EXPENSE_CATEGORY ? "is-active" : ""
                    }`}
                    onClick={() =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        category: CUSTOM_EXPENSE_CATEGORY,
                      }))
                    }
                  >
                    Other
                  </button>
                </div>
                {expenseForm.category === CUSTOM_EXPENSE_CATEGORY ? (
                  <label>
                    Custom category
                    <input
                      type="text"
                      value={expenseForm.customCategory}
                      onChange={(event) =>
                        setExpenseForm((prev) => ({ ...prev, customCategory: event.target.value }))
                      }
                      placeholder="Delivery, airtime, loading fee..."
                      required
                    />
                  </label>
                ) : null}
              </div>

              <div className="water-module-sale-block">
                <div className="water-module-inline-head">
                  <span className="water-module-field-label">Amount</span>
                  <span className="water-module-inline-note">Use presets or tap +/- for the exact amount.</span>
                </div>
                <div className="water-module-quick-actions">
                  {EXPENSE_QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`water-module-quick-btn ${expenseAmountValue === value ? "is-active" : ""}`}
                      onClick={() => setExpenseAmountValue(value)}
                    >
                      {formatCurrency(value)}
                    </button>
                  ))}
                </div>
                <div className="water-module-stepper" aria-label="Expense amount control">
                  <button
                    type="button"
                    className="water-module-stepper-btn"
                    onClick={() => adjustExpenseAmount(-1)}
                    aria-label="Reduce expense amount"
                  >
                    <AppIcon icon={faMinus} />
                  </button>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={expenseForm.amount}
                    onChange={(event) => setExpenseAmountValue(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="water-module-stepper-btn"
                    onClick={() => adjustExpenseAmount(1)}
                    aria-label="Increase expense amount"
                  >
                    <AppIcon icon={faPlus} />
                  </button>
                </div>
              </div>

              <div className="water-module-inline-summary">
                <span>{expenseSummaryLabel}</span>
                <strong>{formatCurrency(expenseSummaryAmount)}</strong>
              </div>

              <details className="water-module-optional">
                <summary>Optional details</summary>
                <div className="water-module-optional-body">
                  <label>
                    Description
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(event) =>
                        setExpenseForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      placeholder={`${expenseSummaryLabel} expense`}
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(event) =>
                        setExpenseForm((prev) => ({ ...prev, date: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Notes
                    <textarea
                      rows="3"
                      value={expenseForm.notes}
                      onChange={(event) =>
                        setExpenseForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>
              </details>
              <button
                type="submit"
                className="admin-primary water-module-sale-submit"
                disabled={saving || loading}
              >
                <AppIcon icon={faMoneyCheckDollar} />{" "}
                {saving ? "Saving..." : `Log ${formatCurrency(expenseSummaryAmount)}`}
              </button>
            </form>
          </article>

          <article className="admin-card water-module-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Stock Control</p>
                <h3>Quick Correction</h3>
              </div>
              <span className="water-module-card-tag">
                {adjustmentQuantity > 0 ? adjustmentSummaryLabel : "Pick a correction"}
              </span>
            </div>
            <form className="water-module-form" onSubmit={handleAdjustmentSubmit}>
              <div className="water-module-adjustment-block">
                <span className="water-module-field-label">Correction type</span>
                <div className="water-module-toggle-row" role="radiogroup" aria-label="Correction type">
                  <button
                    type="button"
                    className={`water-module-toggle-btn ${adjustmentForm.mode === "remove" ? "is-active is-danger" : ""}`}
                    onClick={() =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        mode: "remove",
                        reason:
                          prev.reason === CUSTOM_ADJUSTMENT_REASON ||
                          ADJUSTMENT_REASON_OPTIONS.remove.includes(prev.reason)
                            ? prev.reason
                            : "",
                      }))
                    }
                    aria-pressed={adjustmentForm.mode === "remove"}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className={`water-module-toggle-btn ${adjustmentForm.mode === "add" ? "is-active is-success" : ""}`}
                    onClick={() =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        mode: "add",
                        reason:
                          prev.reason === CUSTOM_ADJUSTMENT_REASON ||
                          ADJUSTMENT_REASON_OPTIONS.add.includes(prev.reason)
                            ? prev.reason
                            : "",
                      }))
                    }
                    aria-pressed={adjustmentForm.mode === "add"}
                  >
                    Add back
                  </button>
                </div>
              </div>
              <div className="water-module-adjustment-block">
                <div className="water-module-inline-head">
                  <span className="water-module-field-label">Quantity</span>
                  <span className="water-module-inline-note">Use presets for quick audit fixes.</span>
                </div>
                <div className="water-module-quick-actions">
                  {ADJUSTMENT_QUICK_QUANTITIES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`water-module-quick-btn ${adjustmentQuantity === value ? "is-active" : ""}`}
                      onClick={() => setAdjustmentQuantityValue(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="water-module-stepper" aria-label="Correction quantity control">
                  <button
                    type="button"
                    className="water-module-stepper-btn"
                    onClick={() => adjustAdjustmentQuantity(-1)}
                    aria-label="Reduce correction quantity"
                  >
                    <AppIcon icon={faMinus} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={adjustmentForm.quantityDelta}
                    onChange={(event) => setAdjustmentQuantityValue(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="water-module-stepper-btn"
                    onClick={() => adjustAdjustmentQuantity(1)}
                    aria-label="Increase correction quantity"
                  >
                    <AppIcon icon={faPlus} />
                  </button>
                </div>
              </div>
              <div className="water-module-adjustment-block">
                <div className="water-module-inline-head">
                  <span className="water-module-field-label">Reason</span>
                  <span className="water-module-inline-note">Tap a common reason or type your own.</span>
                </div>
                <div className="water-module-quick-actions">
                  {adjustmentReasonOptions.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      className={`water-module-quick-btn ${adjustmentForm.reason === reason ? "is-active" : ""}`}
                      onClick={() => setAdjustmentForm((prev) => ({ ...prev, reason }))}
                    >
                      {reason}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`water-module-quick-btn ${
                      adjustmentForm.reason === CUSTOM_ADJUSTMENT_REASON ? "is-active" : ""
                    }`}
                    onClick={() =>
                      setAdjustmentForm((prev) => ({
                        ...prev,
                        reason: CUSTOM_ADJUSTMENT_REASON,
                      }))
                    }
                  >
                    Other
                  </button>
                </div>
                {adjustmentHasCustomReason ? (
                  <label>
                    Custom reason
                    <input
                      type="text"
                      value={adjustmentForm.customReason}
                      onChange={(event) =>
                        setAdjustmentForm((prev) => ({ ...prev, customReason: event.target.value }))
                      }
                      placeholder="Breakage, count fix, returned packs..."
                      required
                    />
                  </label>
                ) : null}
              </div>
              <div className="water-module-inline-summary">
                <span>{adjustmentForm.mode === "add" ? "Stock increase" : "Stock decrease"}</span>
                <strong>{adjustmentSummaryLabel}</strong>
              </div>
              <details className="water-module-optional">
                <summary>Optional details</summary>
                <div className="water-module-optional-body">
                  <label>
                    Date
                    <input
                      type="date"
                      value={adjustmentForm.date}
                      onChange={(event) =>
                        setAdjustmentForm((prev) => ({ ...prev, date: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Notes
                    <textarea
                      rows="3"
                      value={adjustmentForm.notes}
                      onChange={(event) =>
                        setAdjustmentForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>
              </details>
              <button type="submit" className="admin-primary water-module-sale-submit" disabled={saving || loading}>
                <AppIcon icon={faBoxesStacked} /> {saving ? "Saving..." : "Save correction"}
              </button>
            </form>
          </article>
        </section>

        <section className="water-module-ledgers">
          <article className="admin-card water-module-table-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Recent Sales</p>
                <h3>Sales Ledger</h3>
              </div>
              <span className="water-module-card-tag">{sales.length} rows</span>
            </div>
            {loading ? (
              <p className="water-module-empty">Loading sales...</p>
            ) : sales.length ? (
              <div className="water-module-table-wrap">
                <table className="water-module-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Payment</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{formatDate(sale.date)}</td>
                        <td>
                          {sale.customerId
                            ? `${sale.customerName || "Linked customer"} (REEBS)`
                            : sale.customerName || "Walk-in"}
                        </td>
                        <td>{sale.saleChannel === "company" ? "Company" : "Retail"}</td>
                        <td>{getSalePaymentLabel(sale.paymentMethod)}</td>
                        <td>{toNumber(sale.quantity)}</td>
                        <td>{formatCurrency(sale.unitPrice)}</td>
                        <td>{formatCurrency(sale.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="water-module-empty">No sales recorded yet.</p>
            )}
          </article>

          <article className="admin-card water-module-table-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Stock Timeline</p>
                <h3>Restocks & Corrections</h3>
              </div>
              <span className="water-module-card-tag">
                Net movement {summary.unitsRestocked + summary.adjustmentUnits}
              </span>
            </div>
            {loading ? (
              <p className="water-module-empty">Loading stock history...</p>
            ) : stockTimeline.length ? (
              <div className="water-module-table-wrap">
                <table className="water-module-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Qty</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockTimeline.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.label}</td>
                        <td>{entry.detail}</td>
                        <td className={entry.quantity < 0 ? "is-negative" : "is-positive"}>
                          {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                        </td>
                        <td>{entry.amount === null ? "—" : formatCurrency(entry.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="water-module-empty">No stock movement recorded yet.</p>
            )}
          </article>

          <article className="admin-card water-module-table-card">
            <div className="water-module-card-head">
              <div>
                <p className="water-module-card-eyebrow">Expense Ledger</p>
                <h3>Operating Expenses</h3>
              </div>
              <span className="water-module-card-tag">{expenses.length} rows</span>
            </div>
            {loading ? (
              <p className="water-module-empty">Loading expenses...</p>
            ) : expenses.length ? (
              <div className="water-module-table-wrap">
                <table className="water-module-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{formatDate(expense.date)}</td>
                        <td>{expense.category}</td>
                        <td>{expense.description}</td>
                        <td>{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="water-module-empty">No extra expenses logged yet.</p>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}

export default AdminWater;
