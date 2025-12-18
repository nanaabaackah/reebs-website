import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./master.css";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

const getQuantity = (item) => {
  const raw = item?.quantity ?? item?.stock ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCategory = (item) =>
  item?.specificCategory || item?.specificcategory || item?.sourceCategoryCode || "-";

function Admin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeItem, setActiveItem] = useState(null);
  const [formState, setFormState] = useState({
    type: "StockIn",
    quantity: "",
    notes: "",
    reference: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refreshInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/.netlify/functions/inventory");
      if (!response.ok) {
        throw new Error("Unable to fetch inventory.");
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
      setError("We couldn't load inventory right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const inventory = useMemo(() => {
    return [...items].sort((a, b) => {
      const nameA = (a?.name || "").toLowerCase();
      const nameB = (b?.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [items]);

  const totalItems = inventory.length;
  const totalUnits = inventory.reduce((sum, item) => sum + getQuantity(item), 0);
  const lowStock = inventory.filter((item) => getQuantity(item) <= 2).length;

  const openAdjustForm = (item) => {
    setActiveItem(item);
    setFormState({ type: "StockIn", quantity: "", notes: "", reference: "" });
    setSubmitError("");
    setSuccess("");
  };

  const closeAdjustForm = () => {
    setActiveItem(null);
    setSubmitError("");
    setSuccess("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!activeItem) return;
    setSubmitError("");
    setSuccess("");

    const parsedQty = Number(formState.quantity);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setSubmitError("Quantity must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/.netlify/functions/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeItem.id,
          type: formState.type,
          quantity: parsedQty,
          notes: formState.notes.trim() || undefined,
          reference: formState.reference.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Stock update failed.");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItem.id
            ? { ...item, quantity: payload.newStock }
            : item
        )
      );
      setSuccess(payload?.message || "Stock updated.");
    } catch (err) {
      console.error("Stock update failed", err);
      setSubmitError(err.message || "Stock update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <AdminBreadcrumb items={[{ label: "Inventory" }]} />
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Inventory Control</p>
            <h1>Stock Admin</h1>
            <p className="admin-subtitle">
              Track live stock, spot low inventory, and adjust quantities in seconds.
            </p>
          </div>
          <button className="admin-refresh" onClick={refreshInventory}>
            Refresh
          </button>
        </header>

        <section className="admin-cards">
          <div className="admin-card">
            <p className="admin-card-label">Total items</p>
            <h2>{totalItems}</h2>
            <span>SKUs listed</span>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Units on hand</p>
            <h2>{totalUnits}</h2>
            <span>All warehouses</span>
          </div>
          <div className="admin-card">
            <p className="admin-card-label">Low stock</p>
            <h2>{lowStock}</h2>
            <span>At or below 2 units</span>
          </div>
        </section>

        <section className="admin-table">
          <div className="admin-table-header">
            <h3>Current inventory</h3>
            {loading && <span className="admin-status">Loading inventory...</span>}
            {!loading && error && <span className="admin-error">{error}</span>}
          </div>

          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {!loading && inventory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      No items found in inventory.
                    </td>
                  </tr>
                )}
                {inventory.map((item) => {
                  const quantity = getQuantity(item);
                  const isLow = quantity <= 2;
                  return (
                    <tr key={item.id} className={isLow ? "is-low" : ""}>
                      <td>
                        <div className="admin-product">
                          <span className="admin-product-name">{item.name || "Untitled"}</span>
                          <span className="admin-product-id">ID {item.id}</span>
                        </div>
                      </td>
                      <td>{item.sku || "-"}</td>
                      <td>{getCategory(item)}</td>
                      <td>
                        <span className="admin-stock">{quantity}</span>
                      </td>
                      <td>
                        <button
                          className="admin-adjust"
                          onClick={() => openAdjustForm(item)}
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {activeItem && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal-panel">
            <header>
              <div>
                <p className="admin-eyebrow">Adjust stock</p>
                <h2>{activeItem.name || "Untitled"}</h2>
                <span className="admin-modal-meta">ID {activeItem.id}</span>
              </div>
              <button className="admin-close" onClick={closeAdjustForm} aria-label="Close">
                Close
              </button>
            </header>

            <form onSubmit={onSubmit} className="admin-form">
              <label>
                Movement type
                <select
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, type: event.target.value }))
                  }
                >
                  <option value="StockIn">Stock In</option>
                  <option value="StockOut">Stock Out</option>
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={formState.quantity}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  placeholder="Enter units"
                  required
                />
              </label>

              <label>
                Reference (optional)
                <input
                  type="text"
                  value={formState.reference}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, reference: event.target.value }))
                  }
                  placeholder="PO number, event, etc."
                />
              </label>

              <label>
                Notes (optional)
                <textarea
                  rows="3"
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Add any context..."
                />
              </label>

              {submitError && <p className="admin-error">{submitError}</p>}
              {success && <p className="admin-success">{success}</p>}

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={closeAdjustForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={submitting}>
                  {submitting ? "Updating..." : "Confirm update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
