/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faPlus, faReceipt } from "@fortawesome/free-solid-svg-icons";
import AdminBreadcrumb from "../components/AdminBreadcrumb";
import { useAuth } from "../components/AuthContext";
import "./master.css";

const CATEGORIES = ["Logistics", "Operational", "Payroll", "Marketing", "Maintenance"];

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

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

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
  const [form, setForm] = useState({
    category: "Logistics",
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

  const fetchExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/.netlify/functions/expenses");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load expenses.");
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Expenses fetch failed", err);
      setError(err.message || "Unable to load expenses.");
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
        await fetchExpenses();
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
    fetchExpenses();
    fetchLinks();
  }, []);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + toNumber(expense.amount) / 100, 0),
    [expenses]
  );

  const totalsByCategory = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      const total = expenses
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + toNumber(item.amount) / 100, 0);
      acc[category] = total;
      return acc;
    }, {});
  }, [expenses]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, []);

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
      setExpenses((prev) => [data, ...prev]);
      setStatus("Expense logged.");
      setForm((prev) => ({ ...prev, amount: "", description: "", orderId: "", bookingId: "" }));
    } catch (err) {
      console.error("Expense save failed", err);
      setError(err.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expenses-page">
      <div className="expenses-shell">
        <AdminBreadcrumb items={[{ label: "Expenses" }]} />

        <header className="expenses-header">
          <div>
            <p className="expenses-eyebrow">Operating Expenses</p>
            <h1>Expense Tracker</h1>
            <p className="expenses-subtitle">
              Capture logistics, operational, payroll, and marketing spend to calculate true net profit.
            </p>
          </div>
          <div className="expenses-total-card">
            <p className="expenses-card-label">Monthly total</p>
            <h3>{formatCurrency(totalExpenses)}</h3>
            <p>{monthLabel}</p>
          </div>
        </header>

        {error && <p className="expenses-error">{error}</p>}
        {status && <p className="expenses-success">{status}</p>}

        <section className="expenses-kpis">
          {CATEGORIES.map((category) => (
            <div key={category} className="expenses-kpi">
              <span className={`expenses-tag ${category.toLowerCase()}`}>{category}</span>
              <strong>{formatCurrency(totalsByCategory[category] || 0)}</strong>
            </div>
          ))}
        </section>

        <div className="expenses-grid">
          <section className="expenses-card">
            <div className="expenses-card-head">
              <h2>
                <FontAwesomeIcon icon={faPlus} /> Log expense
              </h2>
              <p className="expenses-muted">Capture operational costs in seconds.</p>
            </div>
            <form className="expenses-form" onSubmit={handleSubmit}>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
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
                  <FontAwesomeIcon icon={faReceipt} /> Expense ledger
                </h3>
                <span>{expenses.length} records</span>
              </div>
              <div className="expenses-actions">
                <button type="button" className="expenses-secondary" onClick={fetchExpenses}>
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
                          <span className={`expenses-tag ${String(expense.category || "").toLowerCase()}`}>
                            {expense.category}
                          </span>
                        </td>
                        <td>
                          {formatExpenseLink(expense)}
                        </td>
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
