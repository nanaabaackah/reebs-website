import React, { useEffect, useMemo, useState } from "react";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faEnvelope, faPhone, faHistory, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

const formatMoney = (value, currency = "GHS") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  } catch {
    return `${currency} ${Math.round(amount / 100)}`;
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const sanitizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "" });
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/.netlify/functions/customers");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load customers");
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load customers", err);
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) => {
      return (
        String(customer.name || "").toLowerCase().includes(needle) ||
        String(customer.email || "").toLowerCase().includes(needle) ||
        String(customer.phone || "").toLowerCase().includes(needle)
      );
    });
  }, [customers, searchTerm]);

  const openDetail = async (customer) => {
    setActiveCustomer(customer);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/customers?id=${customer.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load customer profile");
      setDetail(data);
    } catch (err) {
      console.error("Failed to load customer profile", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const createCustomer = async (event) => {
    event.preventDefault();
    setCreateError("");
    try {
      const res = await fetch("/.netlify/functions/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create customer");
      setCustomers((prev) => [data, ...prev]);
      setCreateForm({ name: "", email: "", phone: "" });
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err.message || "Failed to create customer");
    }
  };

  return (
    <div className="crm-page">
      <div className="crm-shell">
        <AdminBreadcrumb items={[{ label: "Customers" }]} />

        <header className="crm-header">
          <div>
            <p className="crm-eyebrow">Customer CRM</p>
            <h1>Customer CRM</h1>
            <p className="crm-subtitle">Manage relationships, loyalty, and lifetime value across rentals and retail.</p>
          </div>
          <button type="button" className="crm-primary" onClick={() => setCreateOpen(true)}>
            <FontAwesomeIcon icon={faUserPlus} /> Add Customer
          </button>
        </header>

        <div className="crm-search">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && <p className="crm-muted">Loading customers...</p>}
        {!loading && error && <p className="crm-error">{error}</p>}

        {!loading && !error && (
          <div className="crm-grid">
            {filtered.map((customer) => (
              <div key={customer.id} className="crm-card">
                <div className="crm-card-head">
                  <h3>{customer.name}</h3>
                  <span className="crm-badge">Client #{customer.id}</span>
                </div>
                <div className="crm-details">
                  <p><FontAwesomeIcon icon={faEnvelope} /> {customer.email || "No email"}</p>
                  <p><FontAwesomeIcon icon={faPhone} /> {customer.phone || "No phone"}</p>
                </div>
                <div className="crm-stats">
                  <div>
                    <span>Orders</span>
                    <strong>{customer.orders}</strong>
                  </div>
                  <div>
                    <span>Bookings</span>
                    <strong>{customer.bookings}</strong>
                  </div>
                </div>
                <div className="crm-actions">
                  {customer.phone && (
                    <>
                      <a href={`tel:${sanitizePhone(customer.phone)}`} className="crm-action">
                        <FontAwesomeIcon icon={faPhone} /> Call
                      </a>
                      <a href={`https://wa.me/${sanitizePhone(customer.phone)}`} className="crm-action" target="_blank" rel="noreferrer">
                        <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                      </a>
                    </>
                  )}
                  <button type="button" className="crm-secondary" onClick={() => openDetail(customer)}>
                    <FontAwesomeIcon icon={faHistory} /> View Profile
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && <p className="crm-muted">No customers found.</p>}
          </div>
        )}
      </div>

      {createOpen && (
        <div className="customers-modal" role="dialog" aria-modal="true">
          <div className="customers-modal-panel">
            <header>
              <div>
                <p className="customers-eyebrow">New customer</p>
                <h2>Add customer</h2>
              </div>
              <button className="customers-modal-close" onClick={() => setCreateOpen(false)} aria-label="Close">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>
            <form className="customers-form" onSubmit={createCustomer}>
              <label>
                Name
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>
              <label>
                Phone
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>
              {createError && <p className="customers-error">{createError}</p>}
              <div className="customers-form-actions">
                <button type="button" className="customers-secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="customers-primary">Save customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeCustomer && (
        <div className="customers-modal" role="dialog" aria-modal="true">
          <div className="customers-modal-panel crm-detail-panel">
            <header>
              <div>
                <p className="customers-eyebrow">Client 360</p>
                <h2>{activeCustomer.name}</h2>
                <p className="crm-muted">{activeCustomer.email || "No email"} · {activeCustomer.phone || "No phone"}</p>
              </div>
              <button className="customers-modal-close" onClick={() => setActiveCustomer(null)} aria-label="Close">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>
            {detailLoading && <p className="crm-muted">Loading history...</p>}
            {detail && (
              <div className="crm-detail-grid">
                <div className="crm-detail-card">
                  <h4>Totals</h4>
                  <p>Orders: {detail.totals.orders}</p>
                  <p>Bookings: {detail.totals.bookings}</p>
                  <p>Retail spent: {formatMoney(detail.totals.totalSpent)}</p>
                  <p>Rental spent: {formatMoney(detail.totals.totalRented)}</p>
                </div>
                <div className="crm-detail-card">
                  <h4>Orders</h4>
                  {detail.orders.length === 0 ? (
                    <p className="crm-muted">No orders yet.</p>
                  ) : (
                    <ul>
                      {detail.orders.slice(0, 6).map((order) => (
                        <li key={order.id}>
                          {order.orderNumber} · {formatDate(order.orderDate)} ·{" "}
                          {formatMoney(order.total_with_delivery ?? order.total_amount)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="crm-detail-card">
                  <h4>Bookings</h4>
                  {detail.bookings.length === 0 ? (
                    <p className="crm-muted">No bookings yet.</p>
                  ) : (
                    <ul>
                      {detail.bookings.slice(0, 6).map((booking) => (
                        <li key={booking.id}>
                          #{booking.id} · {formatDate(booking.eventDate)} · {formatMoney(booking.totalAmount)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
