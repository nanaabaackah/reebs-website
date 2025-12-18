import React, { useEffect, useMemo, useState } from "react";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRotateRight, faXmark, faPen } from "@fortawesome/free-solid-svg-icons";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

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

const normalizeCurrency = (currency) => {
  if (typeof currency !== "string") return "GHS";
  const trimmed = currency.trim();
  return trimmed ? trimmed.toUpperCase() : "GHS";
};

const formatMoney = (value, currency = "GHS") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  const normalized = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalized} ${amount}`;
  }
};

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [productQuery, setProductQuery] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    venueAddress: "",
    status: "pending",
    items: [],
  });

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingsRes, inventoryRes, customersRes] = await Promise.all([
        fetch("/.netlify/functions/bookings"),
        fetch("/.netlify/functions/inventory"),
        fetch("/.netlify/functions/customers"),
      ]);

      const [bookingsText, inventoryText, customersText] = await Promise.all([
        bookingsRes.text(),
        inventoryRes.text(),
        customersRes.text(),
      ]);

      const tryJson = (text) => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      const bookingsPayload = tryJson(bookingsText);
      const inventoryPayload = tryJson(inventoryText);
      const customersPayload = tryJson(customersText);

      if (!bookingsRes.ok) {
        throw new Error(bookingsPayload?.error || `Failed to fetch bookings (${bookingsRes.status}).`);
      }
      if (!inventoryRes.ok) {
        throw new Error(inventoryPayload?.error || `Failed to fetch products (${inventoryRes.status}).`);
      }
      if (!customersRes.ok) {
        throw new Error(customersPayload?.error || `Failed to fetch customers (${customersRes.status}).`);
      }

      setBookings(Array.isArray(bookingsPayload) ? bookingsPayload : []);
      setCustomers(Array.isArray(customersPayload) ? customersPayload : []);

      const rentalProducts = (Array.isArray(inventoryPayload) ? inventoryPayload : []).filter((item) => {
        const source = (item.sourceCategoryCode || item.sourcecategorycode || "").toLowerCase();
        if (!source) return false;
        return source === "rental" || source === "rentals";
      });

      setProducts(rentalProducts);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setError(err.message || "We couldn't load bookings right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productMap = useMemo(() => {
    const map = new Map();
    for (const item of products) {
      map.set(Number(item.id), item);
    }
    return map;
  }, [products]);

  const filteredBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return bookings;
    return bookings.filter((booking) => {
      const idText = String(booking.id || "").toLowerCase();
      const customer = String(booking.customerName || "").toLowerCase();
      const status = String(booking.status || "").toLowerCase();
      return idText.includes(needle) || customer.includes(needle) || status.includes(needle);
    });
  }, [bookings, query]);

  const filteredProducts = useMemo(() => {
    const needle = productQuery.trim().toLowerCase();
    const list = [...products].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    if (!needle) return list;
    return list.filter((product) => {
      return product.name?.toLowerCase().includes(needle) || product.sku?.toLowerCase().includes(needle);
    });
  }, [productQuery, products]);

  const bookingCurrency = useMemo(() => {
    const firstItem = form.items[0];
    if (!firstItem) return "GHS";
    const product = productMap.get(Number(firstItem.productId));
    return normalizeCurrency(product?.currency || "GHS");
  }, [form.items, productMap]);

  const bookingTotalCents = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const product = productMap.get(Number(item.productId));
      const priceCents = Number(product?.price ?? 0);
      const quantity = Number(item.quantity) || 1;
      return sum + priceCents * quantity;
    }, 0);
  }, [form.items, productMap]);

  const addItem = (product) => {
    setForm((prev) => {
      const existing = prev.items.find((item) => Number(item.productId) === Number(product.id));
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            Number(item.productId) === Number(product.id)
              ? { ...item, quantity: (Number(item.quantity) || 1) + 1 }
              : item
          ),
        };
      }
      return { ...prev, items: [...prev.items, { productId: product.id, quantity: 1 }] };
    });
  };

  const updateItemQuantity = (productId, nextValue) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (Number(item.productId) !== Number(productId)) return item;
        const next = Math.max(1, parseInt(nextValue, 10) || 1);
        return { ...item, quantity: next };
      }),
    }));
  };

  const removeItem = (productId) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => Number(item.productId) !== Number(productId)),
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setSaveError("");
    setProductQuery("");
    setForm({
      customerId: customers[0]?.id ? String(customers[0].id) : "",
      eventDate: "",
      startTime: "",
      endTime: "",
      venueAddress: "",
      status: "pending",
      items: [],
    });
    setModalOpen(true);
  };

  const openEdit = (booking) => {
    setEditing(booking);
    setSaveError("");
    setProductQuery("");

    setForm({
      customerId: booking.customerId ? String(booking.customerId) : "",
      eventDate: booking.eventDate ? String(booking.eventDate).slice(0, 10) : "",
      startTime: booking.startTime || "",
      endTime: booking.endTime || "",
      venueAddress: booking.venueAddress || "",
      status: booking.status || "pending",
      items: Array.isArray(booking.items)
        ? booking.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        : [],
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setSaveError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaveError("");

    if (!form.customerId) return setSaveError("Select a customer.");
    if (!form.eventDate) return setSaveError("Event date is required.");
    if (!form.venueAddress.trim()) return setSaveError("Venue address is required.");
    if (!form.items.length) return setSaveError("Add at least one item to the booking.");

    setSaving(true);
    try {
      const isEdit = Boolean(editing?.id);
      const response = await fetch("/.netlify/functions/bookings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEdit ? editing.id : undefined,
          customerId: Number(form.customerId),
          eventDate: form.eventDate,
          startTime: form.startTime || null,
          endTime: form.endTime || null,
          venueAddress: form.venueAddress,
          status: form.status,
          items: form.items,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Save failed.");

      setBookings((prev) => {
        if (isEdit) return prev.map((row) => (row.id === payload.id ? payload : row));
        return [payload, ...prev];
      });

      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Save booking failed", err);
      setSaveError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bookings-page">
      <div className="bookings-shell">
        <AdminBreadcrumb items={[{ label: "Bookings" }]} />

        <header className="bookings-header">
          <div>
            <p className="bookings-eyebrow">Bookings</p>
            <h1>Rental bookings</h1>
            <p className="bookings-subtitle">Review upcoming events, track statuses, and create bookings.</p>
          </div>
          <div className="bookings-actions">
            <button type="button" className="bookings-secondary" onClick={fetchAll}>
              <FontAwesomeIcon icon={faRotateRight} />
              Refresh
            </button>
            <button type="button" className="bookings-primary" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} />
              Add booking
            </button>
          </div>
        </header>

        <section className="bookings-panel">
          <div className="bookings-panel-header">
            <div>
              <h3>All bookings</h3>
              <span>{bookings.length} total</span>
            </div>
            <label className="bookings-search">
              Search
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Id, customer, status"
              />
            </label>
          </div>

          {loading && <p className="bookings-status">Loading bookings...</p>}
          {!loading && error && <p className="bookings-error">{error}</p>}

          {!loading && !error && (
            <div className="bookings-table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Event</th>
                    <th>Time</th>
                    <th>Venue</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const timeWindow = booking.startTime || booking.endTime
                      ? `${booking.startTime || ""}${booking.endTime ? ` – ${booking.endTime}` : ""}`
                      : "-";
                    const itemsCount = Array.isArray(booking.items) ? booking.items.length : 0;

                    return (
                      <tr key={booking.id}>
                        <td>#{booking.id}</td>
                        <td>{booking.customerName || "-"}</td>
                        <td>{formatDate(booking.eventDate)}</td>
                        <td>{timeWindow}</td>
                        <td className="bookings-venue">{booking.venueAddress || "-"}</td>
                        <td>{itemsCount}</td>
                        <td>{formatMoney((booking.totalAmount || 0) / 100, "GHS")}</td>
                        <td>
                          <span className={`bookings-pill ${booking.status || "pending"}`}>
                            {booking.status || "pending"}
                          </span>
                        </td>
                        <td className="bookings-actions-col">
                          <button type="button" className="bookings-edit" onClick={() => openEdit(booking)}>
                            <FontAwesomeIcon icon={faPen} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!filteredBookings.length && (
                    <tr>
                      <td colSpan={9} className="bookings-empty">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="customers-modal" role="dialog" aria-modal="true">
          <div className="customers-modal-panel">
            <header>
              <div>
                <p className="customers-eyebrow">{editing ? "Edit" : "New"} booking</p>
                <h2>{editing ? "Update" : "Add"} booking</h2>
              </div>
              <button type="button" className="customers-modal-close" onClick={closeModal} aria-label="Close">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>

            <form className="customers-form" onSubmit={save}>
              <label>
                Customer
                <select
                  value={form.customerId}
                  onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.email ? `- ${customer.email}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Venue address
                <input
                  type="text"
                  value={form.venueAddress}
                  onChange={(event) => setForm((prev) => ({ ...prev, venueAddress: event.target.value }))}
                  placeholder="Venue / delivery address"
                  required
                />
              </label>

              <label>
                Event date
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                  required
                />
              </label>

              <label>
                Start time (optional)
                <input
                  type="text"
                  value={form.startTime}
                  onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  placeholder="10:00 AM"
                />
              </label>

              <label>
                End time (optional)
                <input
                  type="text"
                  value={form.endTime}
                  onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                  placeholder="04:00 PM"
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                Add items
                <input
                  type="text"
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Search rentals"
                />
              </label>

              <div className="booking-items-picker">
                <div className="booking-items-list">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="booking-item-add"
                      onClick={() => addItem(product)}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>

                {form.items.length > 0 && (
                  <div className="booking-items-selected">
                    {form.items.map((item) => {
                      const product = productMap.get(Number(item.productId));
                      return (
                        <div key={item.productId} className="booking-item-row">
                          <span>{product?.name || `Product ${item.productId}`}</span>
                          <div className="booking-item-controls">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) => updateItemQuantity(item.productId, event.target.value)}
                            />
                            <button type="button" onClick={() => removeItem(item.productId)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="booking-item-total">
                      <span>Total</span>
                      <strong>{formatMoney(bookingTotalCents / 100, bookingCurrency)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {saveError && <p className="customers-error">{saveError}</p>}

              <div className="customers-form-actions">
                <button type="button" className="customers-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="customers-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
