/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { AppIcon } from "/src/components/Icon";
import { faPlus, faReceipt } from "/src/icons/iconSet";
import AdminBreadcrumb from "../components/AdminBreadcrumb";
import { useAuth } from "../components/AuthContext";
import {
  EXPENSE_CATEGORY_LABELS,
  getExpenseCategoryStyle,
  inferExpenseCategory,
  normalizeExpenseCategory,
} from "../data/expenseCategories";
import "../styles/admin.css";

const AUTO_CATEGORY_VALUE = "auto";

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch (err) {
    return `GHS ${Number(amount || 0).toFixed(2)}`;
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

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return "All time";
  const date = new Date(`${monthKey}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Selected period";
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeExpense = (expense) => ({
  ...expense,
  category: normalizeExpenseCategory(expense?.category) || "Miscellaneous",
});

const formatExpenseLink = (expense) => {
  const parts = [];
  if (expense?.orderId) parts.push(`Order #${expense.orderId}`);
  if (expense?.bookingId) parts.push(`Booking #${expense.bookingId}`);
  return parts.length ? parts.join(" · ") : "-";
};

function AdminExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [allTimeView, setAllTimeView] = useState(false);
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({
    category: AUTO_CATEGORY_VALUE,
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    orderId: "",
    bookingId: "",
  });

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const fetchLinks = async () => {
    try {
      const [ordersRes, bookingsRes] = await Promise.all([
        fetch("/.netlify/functions/orders"),
        fetch("/.netlify/functions/bookings"),
      ]);
      const [ordersData, bookingsData] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : [],
        bookingsRes.ok ? bookingsRes.json() : [],
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.warn("Expense link fetch failed", err);
      setOrders([]);
      setBookings([]);
    }
  };

  const fetchExpenses = async ({ month = monthFilter, allTime = allTimeView } = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (!allTime && month) {
        params.set("month", `${month}-01`);
      }
      const query = params.toString();
      const res = await fetch(`/.netlify/functions/expenses${query ? `?${query}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load expenses.");
      setExpenses(Array.isArray(data) ? data.map(normalizeExpense) : []);
    } catch (err) {
      console.error("Expenses fetch failed", err);
      setError(err.message || "Unable to load expenses.");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const seedExpenses = async () => {
    setSeeding(true);
    setStatus("");
    setError("");
    try {
      const res = await fetch("/.netlify/functions/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to seed expenses.");
      if (data?.seeded) {
        setStatus("Sample expenses loaded.");
        await fetchExpenses({ month: monthFilter, allTime: allTimeView });
      } else {
        setStatus("Expenses already exist in the database.");
      }
    } catch (err) {
      console.error("Expense seed failed", err);
      setError(err.message || "Unable to seed expenses.");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    fetchExpenses({ month: monthFilter, allTime: allTimeView });
  }, [monthFilter, allTimeView]);

  const categoryList = useMemo(() => {
    const extras = Array.from(
      new Set(
        expenses
          .map((expense) => normalizeExpenseCategory(expense.category))
          .filter(Boolean)
      )
    )
      .filter((category) => !EXPENSE_CATEGORY_LABELS.includes(category))
      .sort((a, b) => a.localeCompare(b));

    return [...EXPENSE_CATEGORY_LABELS, ...extras];
  }, [expenses]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + toNumber(expense.amount) / 100, 0),
    [expenses]
  );

  const totalsByCategory = useMemo(() => {
    return categoryList.reduce((acc, category) => {
      const total = expenses
        .filter((item) => normalizeExpenseCategory(item.category) === category)
        .reduce((sum, item) => sum + toNumber(item.amount) / 100, 0);
      acc[category] = total;
      return acc;
    }, {});
  }, [categoryList, expenses]);

  const periodLabel = useMemo(
    () => (allTimeView ? "All time" : formatMonthLabel(monthFilter)),
    [allTimeView, monthFilter]
  );

  const suggestedCategory = useMemo(
    () => inferExpenseCategory({ category: form.category, description: form.description }),
    [form.category, form.description]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const res = await fetch("/.netlify/functions/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          amount: form.amount,
          description: form.description,
          date: form.date,
          orderId: form.orderId || undefined,
          bookingId: form.bookingId || undefined,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to log expense.");
      const normalizedRow = normalizeExpense(data);
      setExpenses((prev) => [normalizedRow, ...prev]);
      if (data?.categoryAutoDetected) {
        setStatus(`Expense logged. Category auto-detected as ${normalizedRow.category}.`);
      } else {
        setStatus("Expense logged.");
      }
      setForm((prev) => ({
        ...prev,
        category: AUTO_CATEGORY_VALUE,
        amount: "",
        description: "",
        orderId: "",
        bookingId: "",
      }));
    } catch (err) {
      console.error("Expense save failed", err);
      setError(err.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expenses-page expenses-page--redesign">
      <div className="expenses-shell expenses-shell--redesign">
        <AdminBreadcrumb items={[{ label: "Expenses" }]} />

        <header className="expenses-header">
          <div>
            <p className="expenses-eyebrow">Operating Expenses</p>
            <h1>Expense Tracker</h1>
            <p className="expenses-subtitle">
              Mostly automatic bookkeeping: category is inferred from notes, totals roll up by period,
              and accounting statements update automatically.
            </p>
          </div>
          <div className="expenses-total-card">
            <p className="expenses-card-label">Total in view</p>
            <h3>{formatCurrency(totalExpenses)}</h3>
            <p>{periodLabel}</p>
          </div>
        </header>

        <div className="expenses-filters">
          <label>
            Posting period
            <input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              disabled={allTimeView}
            />
          </label>
          <label className="expenses-check">
            <input
              type="checkbox"
              checked={allTimeView}
              onChange={(event) => setAllTimeView(event.target.checked)}
            />
            Show all time
          </label>
        </div>

        {error && <p className="expenses-error">{error}</p>}
        {status && <p className="expenses-success">{status}</p>}

        <section className="expenses-kpis">
          {categoryList.map((category) => (
            <div key={category} className="expenses-kpi">
              <span className="expenses-tag" style={getExpenseCategoryStyle(category)}>
                {category}
              </span>
              <strong>{formatCurrency(totalsByCategory[category] || 0)}</strong>
            </div>
          ))}
        </section>

        <div className="expenses-grid">
          <section className="expenses-card">
            <div className="expenses-card-head">
              <h2>
                <AppIcon icon={faPlus} /> Log expense
              </h2>
              <p className="expenses-muted">Default mode auto-categorizes so non-accountants can post quickly.</p>
            </div>
            <form className="expenses-form" onSubmit={handleSubmit}>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <option value={AUTO_CATEGORY_VALUE}>Auto-detect from description</option>
                  {EXPENSE_CATEGORY_LABELS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <p className="expenses-hint">
                Suggested category: <strong>{suggestedCategory}</strong>
              </p>
              <label>
                Amount (GHS)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
              </label>
              <div className="expenses-inline">
                <label>
                  Link order (optional)
                  <select
                    value={form.orderId}
                    onChange={(event) => setForm((prev) => ({ ...prev, orderId: event.target.value }))}
                  >
                    <option value="">Select order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {`${formatDate(order.orderDate)} - Order #${order.id} - ${order.customerName || "-"}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Link booking (optional)
                  <select
                    value={form.bookingId}
                    onChange={(event) => setForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                  >
                    <option value="">Select booking</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {`${formatDate(booking.eventDate)} - Booking #${booking.id} - ${
                          booking.customerName || "-"
                        }`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Description
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Fuel for delivery to East Legon"
                  required
                />
              </label>
              <button type="submit" className="expenses-primary" disabled={saving}>
                {saving ? "Saving..." : "Save expense"}
              </button>
            </form>
          </section>

          <section className="admin-table expenses-ledger">
            <div className="admin-table-header">
              <div>
                <h3>
                  <AppIcon icon={faReceipt} /> Expense ledger
                </h3>
                <span>{expenses.length} records</span>
              </div>
              <div className="expenses-actions">
                <button
                  type="button"
                  className="expenses-secondary"
                  onClick={() => fetchExpenses({ month: monthFilter, allTime: allTimeView })}
                >
                  Refresh
                </button>
                {expenses.length === 0 && !loading && (
                  <button
                    type="button"
                    className="expenses-secondary"
                    onClick={seedExpenses}
                    disabled={seeding}
                  >
                    {seeding ? "Seeding..." : "Load demo data"}
                  </button>
                )}
              </div>
            </div>
            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Linked</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="expenses-empty">
                        Loading expenses...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="expenses-empty">
                        No expenses logged yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{formatDate(expense.date)}</td>
                        <td>
                          <span className="expenses-tag" style={getExpenseCategoryStyle(expense.category)}>
                            {expense.category}
                          </span>
                        </td>
                        <td>{formatExpenseLink(expense)}</td>
                        <td>{formatCurrency(toNumber(expense.amount) / 100)}</td>
                        <td>{expense.description || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminExpenses;
