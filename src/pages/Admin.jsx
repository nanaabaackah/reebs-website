import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./master.css";
import AdminBreadcrumb from "../components/AdminBreadcrumb";
import { useAuth } from "../components/AuthContext";

const getQuantity = (item) => {
  const raw = item?.quantity ?? item?.stock ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCategory = (item) =>
  item?.specificCategory || item?.specificcategory || item?.sourceCategoryCode || "-";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatUser = (name) => name || "Admin";
const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function Admin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeItem, setActiveItem] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // table | cards
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [stockActivity, setStockActivity] = useState([]);
  const [stockActivityError, setStockActivityError] = useState("");
  const [formState, setFormState] = useState({
    type: "StockIn",
    quantity: "",
    notes: "",
    reference: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [updatingStockId, setUpdatingStockId] = useState(null);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItemSaving, setNewItemSaving] = useState(false);
  const [newItemError, setNewItemError] = useState("");
  const newItemTemplate = {
    name: "",
    price: "",
    quantity: "",
    sourceCategoryCode: "CLOTHES",
    specificCategory: "",
    description: "",
  };
  const [newItemRows, setNewItemRows] = useState([{ ...newItemTemplate }]);
  const { user } = useAuth();

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
    const fetchStockActivity = async () => {
      setStockActivityError("");
      try {
        const res = await fetch("/.netlify/functions/stockActivity");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Unable to load stock history.");
        setStockActivity(Array.isArray(data?.months) ? data.months : []);
      } catch (err) {
        console.error("Failed to load stock activity", err);
        setStockActivity([]);
        setStockActivityError(err.message || "Unable to load stock history.");
      }
    };
    fetchStockActivity();
  }, []);

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  useEffect(() => {
    const handleClickAway = (event) => {
      if (!event.target.closest(".inventory-menu")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, categoryFilter, inStockOnly, viewMode, items.length]);

  const sortValue = (item, key) => {
    switch (key) {
      case "id":
        return Number(item.id) || 0;
      case "name":
        return (item.name || "").toLowerCase();
      case "sku":
        return (item.sku || "").toLowerCase();
      case "category":
        return (getCategory(item) || "").toLowerCase();
      case "quantity":
        return getQuantity(item);
      case "lastUpdatedAt":
        return new Date(item.lastUpdatedAt || item.updatedAt || 0).getTime();
      case "lastUpdatedByName":
        return (item.lastUpdatedByName || "").toLowerCase();
      default:
        return item[key] ?? "";
    }
  };

  const inventory = useMemo(() => {
    const list = [...items];
    const needle = search.trim().toLowerCase();
    const filterCategory = categoryFilter.toLowerCase();
    const filtered = list.filter((item) => {
      const quantity = getQuantity(item);
      if (needle) {
        const name = (item.name || "").toLowerCase();
        const sku = (item.sku || "").toLowerCase();
        if (!name.includes(needle) && !sku.includes(needle)) return false;
      }
      if (filterCategory !== "all") {
        const cat = (getCategory(item) || "").toLowerCase();
        if (!cat.includes(filterCategory)) return false;
      }
      if (inStockOnly && quantity <= 0) return false;
      return true;
    });

    const { key, direction } = sortConfig;
    filtered.sort((a, b) => {
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
      if (va < vb) return direction === "asc" ? -1 : 1;
      if (va > vb) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [items, sortConfig, search, categoryFilter, inStockOnly]);

  const pageCount = Math.max(1, Math.ceil(inventory.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const paginatedInventory = useMemo(() => {
    const start = clampedPage * pageSize;
    return inventory.slice(start, start + pageSize);
  }, [inventory, clampedPage, pageSize]);

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

  const toggleRowMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const updateNewItemRow = (index, field, value) => {
    setNewItemRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addNewItemRow = () => {
    setNewItemRows((prev) => [...prev, { ...newItemTemplate }]);
  };

  const removeNewItemRow = (index) => {
    setNewItemRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const cat = getCategory(item);
      if (cat && cat !== "-") set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const resetNewItemForm = () => {
    setNewItemRows([{ ...newItemTemplate }]);
  };

  const copyToClipboard = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
    } catch (err) {
      console.warn("Clipboard copy failed", err);
    }
  };

  const createInventoryItems = async (event) => {
    event.preventDefault();
    setNewItemError("");
    setSuccess("");

    const rows = newItemRows
      .map((row) => ({
        ...row,
        name: row.name.trim(),
        specificCategory: row.specificCategory.trim(),
        description: row.description.trim(),
      }))
      .filter((row) => row.name);

    if (rows.length === 0) {
      setNewItemError("Add at least one item with a name.");
      return;
    }

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const priceValue = Number(row.price);
      const quantityValue = Number.parseInt(row.quantity || "0", 10) || 0;
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        setNewItemError(`Row ${i + 1}: Price must be zero or higher.`);
        return;
      }
      if (!Number.isFinite(quantityValue) || quantityValue < 0) {
        setNewItemError(`Row ${i + 1}: Quantity must be zero or higher.`);
        return;
      }
    }

    setNewItemSaving(true);
    try {
      const created = [];
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const response = await fetch("/.netlify/functions/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            price: Math.round(Number(row.price) * 100),
            stock: Number.parseInt(row.quantity || "0", 10) || 0,
            sourceCategoryCode: row.sourceCategoryCode,
            specificCategory: row.specificCategory || undefined,
            description: row.description || undefined,
            currency: "GHS",
            userId: user?.id,
            userName:
              user?.fullName ||
              user?.name ||
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              undefined,
            userEmail: user?.email,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || `Row ${i + 1}: Failed to create item.`);
        }
        created.push(data);
      }

      if (created.length) {
        setItems((prev) => [...created, ...prev]);
      }
      resetNewItemForm();
      setNewItemOpen(false);
      setSuccess(`Added ${created.length} item${created.length === 1 ? "" : "s"}.`);
    } catch (err) {
      console.error("Create items failed", err);
      setNewItemError(err.message || "Failed to create items.");
    } finally {
      setNewItemSaving(false);
    }
  };

  const adjustStockInline = async (item, delta) => {
    if (!delta) return;
    const currentQty = getQuantity(item);
    if (delta < 0 && currentQty <= 0) {
      setSubmitError("Cannot reduce stock below zero.");
      return;
    }

    setUpdatingStockId(item.id);
    setSubmitError("");
    setSuccess("");
    const type = delta > 0 ? "StockIn" : "StockOut";
    const quantity = Math.abs(delta);

    try {
      const response = await fetch("/.netlify/functions/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          type,
          quantity,
          notes: undefined,
          reference: undefined,
          userId: user?.id,
          userName:
            user?.fullName ||
            user?.name ||
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            undefined,
          userEmail: user?.email,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Stock update failed.");
      }

      const actorName =
        user?.fullName ||
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.email ||
        "Updated";

      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                quantity: toNumber(payload.newStock, getQuantity(row)),
                lastUpdatedAt: payload.lastUpdatedAt || new Date().toISOString(),
                lastUpdatedByName: payload.lastUpdatedByName || actorName,
              }
            : row
        )
      );
      setSuccess(payload?.message || "Stock updated.");
    } catch (err) {
      console.error("Inline stock update failed", err);
      setSubmitError(err.message || "Stock update failed.");
    } finally {
      setUpdatingStockId(null);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!activeItem) return;
    setSubmitError("");
    setSuccess("");

    const parsedQty = toNumber(formState.quantity);
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
          userId: user?.id,
          userName: user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
          userEmail: user?.email,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Stock update failed.");
      }

      const actorName =
        user?.fullName ||
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.email ||
        "Updated";

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== activeItem.id) return item;
          return {
            ...item,
            quantity: toNumber(payload.newStock, getQuantity(item)),
            lastUpdatedAt: payload.lastUpdatedAt || new Date().toISOString(),
            lastUpdatedByName: payload.lastUpdatedByName || actorName,
          };
        })
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
          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-chip"
              onClick={() => {
                setNewItemError("");
                setSuccess("");
                setNewItemOpen((open) => !open);
              }}
            >
              {newItemOpen ? "Close" : "Add items"}
            </button>
            <button className="admin-refresh" onClick={refreshInventory}>
              Refresh
            </button>
          </div>
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
          <div className="admin-controls">
            <div className="admin-control-group">
              <label className="admin-search">
                Search
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name or SKU"
                />
              </label>
              <label className="admin-select">
                Category
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                In stock only
              </label>
            </div>
            <div className="admin-view-toggle" role="group" aria-label="Toggle inventory view">
              <button
                type="button"
                className={`admin-chip ${viewMode === "table" ? "is-active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                Table view
              </button>
              <button
                type="button"
                className={`admin-chip ${viewMode === "cards" ? "is-active" : ""}`}
                onClick={() => setViewMode("cards")}
              >
                Card view
              </button>
              <button
                type="button"
                className={`admin-chip ${viewMode === "activity" ? "is-active" : ""}`}
                onClick={() => setViewMode("activity")}
              >
                Activity view
              </button>
            </div>
          </div>

          {viewMode === "activity" && (
            <div className="stock-activity-grid">
              {stockActivityError && <p className="admin-error">{stockActivityError}</p>}
              {stockActivity.length === 0 && !stockActivityError && <p className="admin-empty">No movement history.</p>}
              {stockActivity.map((row) => (
                <div key={row.month_key} className="stock-activity-row">
                  <div>
                    <p className="stock-activity-month">{row.month_key}</p>
                    <p className="stock-activity-meta">Stock in / out</p>
                  </div>
                  <div className="stock-activity-bars">
                    <div className="stock-activity-bar in" style={{ width: `${Math.min(100, Math.abs(row.stock_in || 0))}%` }}>
                      <span>+{row.stock_in || 0}</span>
                    </div>
                    <div className="stock-activity-bar out" style={{ width: `${Math.min(100, Math.abs(row.stock_out || 0))}%` }}>
                      <span>-{row.stock_out || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "table" && (
            <div className="admin-table-scroll">
              <div className="table-pagination">
                <span>
                  Showing {inventory.length === 0 ? 0 : clampedPage * pageSize + 1}-
                  {Math.min(inventory.length, (clampedPage + 1) * pageSize)} of {inventory.length}
                </span>
                <div className="table-pagination-controls">
                  <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={clampedPage === 0}>
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={clampedPage >= pageCount - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("id")}>
                        ID <span className="sort-indicator">{sortIndicator("id")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("name")}>
                        Product <span className="sort-indicator">{sortIndicator("name")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("sku")}>
                        SKU <span className="sort-indicator">{sortIndicator("sku")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("category")}>
                        Category <span className="sort-indicator">{sortIndicator("category")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("quantity")}>
                        Stock <span className="sort-indicator">{sortIndicator("quantity")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("lastUpdatedAt")}>
                        Last updated <span className="sort-indicator">{sortIndicator("lastUpdatedAt")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("lastUpdatedByName")}>
                        Updated by <span className="sort-indicator">{sortIndicator("lastUpdatedByName")}</span>
                      </button>
                    </th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {!loading && inventory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="admin-empty">
                        No items found in inventory.
                      </td>
                    </tr>
                  )}
                  {paginatedInventory.map((item) => {
                    const quantity = getQuantity(item);
                    const isLow = quantity <= 2;
                    return (
                      <tr
                        key={item.id}
                        className={isLow ? "is-low" : ""}
                        onClick={() => openAdjustForm(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openAdjustForm(item);
                          }
                        }}
                      >
                        <td>{item.id}</td>
                        <td>
                          <div className="admin-product">
                            <span className="admin-product-name">{item.name || "Untitled"}</span>
                          </div>
                        </td>
                        <td>{item.sku || "-"}</td>
                        <td>{getCategory(item)}</td>
                        <td>
                          <div
                            className="admin-stock-ctrl"
                            onClick={(e) => e.stopPropagation()}
                            role="group"
                            aria-label={`Adjust stock for ${item.name || "item"}`}
                          >
                            <button
                              type="button"
                              className="admin-stock-btn"
                              onClick={() => adjustStockInline(item, -1)}
                              disabled={updatingStockId === item.id}
                            >
                              −
                            </button>
                            <span className="admin-stock">
                              {updatingStockId === item.id ? "…" : quantity}
                            </span>
                            <button
                              type="button"
                              className="admin-stock-btn"
                              onClick={() => adjustStockInline(item, 1)}
                              disabled={updatingStockId === item.id}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{formatDateTime(item.lastUpdatedAt || item.updatedAt)}</td>
                        <td>{formatUser(item.lastUpdatedByName)}</td>
                        <td>
                          <div className="bookings-menu inventory-menu">
                            <button
                              type="button"
                              className="bookings-edit"
                              aria-haspopup="true"
                              aria-expanded={openMenuId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowMenu(item.id);
                              }}
                            >
                              ⋮
                            </button>
                            <div className={`bookings-menu-list ${openMenuId === item.id ? "open" : ""}`}>
                              <button
                                type="button"
                                onClick={() => {
                                  openAdjustForm(item);
                                  setOpenMenuId(null);
                                }}
                              >
                                Adjust stock
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.sku || item.id)}
                              >
                                Copy SKU
                              </button>
                              <button type="button" onClick={() => copyToClipboard(item.id)}>
                                Copy ID
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "cards" && (
            <>
              <div className="table-pagination">
                <span>
                  Showing {inventory.length === 0 ? 0 : clampedPage * pageSize + 1}-
                  {Math.min(inventory.length, (clampedPage + 1) * pageSize)} of {inventory.length}
                </span>
                <div className="table-pagination-controls">
                  <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={clampedPage === 0}>
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={clampedPage >= pageCount - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="inventory-card-grid">
                {!loading && paginatedInventory.length === 0 && (
                  <p className="admin-empty">No items found in inventory.</p>
                )}
                {paginatedInventory.map((item) => {
                const quantity = getQuantity(item);
                const isLow = quantity <= 2;
                return (
                  <div
                    key={item.id}
                    className={`inventory-card ${isLow ? "is-low" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openAdjustForm(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openAdjustForm(item);
                      }
                    }}
                  >
                    <div className="inventory-card-head">
                      <span className="admin-product-id">ID {item.id}</span>
                      <span className="admin-stock">{quantity}</span>
                      <div
                        className="bookings-menu inventory-menu inventory-card-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="bookings-edit"
                          aria-haspopup="true"
                          aria-expanded={openMenuId === `card-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowMenu(`card-${item.id}`);
                          }}
                        >
                          ⋮
                        </button>
                        <div className={`bookings-menu-list ${openMenuId === `card-${item.id}` ? "open" : ""}`}>
                          <button
                            type="button"
                            onClick={() => {
                              openAdjustForm(item);
                              setOpenMenuId(null);
                            }}
                          >
                            Adjust stock
                          </button>
                          <button type="button" onClick={() => copyToClipboard(item.sku || item.id)}>
                            Copy SKU
                          </button>
                          <button type="button" onClick={() => copyToClipboard(item.id)}>
                            Copy ID
                          </button>
                        </div>
                      </div>
                    </div>
                    <h4 className="inventory-card-title">{item.name || "Untitled"}</h4>
                    <p className="inventory-card-sub">{item.sku || "No SKU"}</p>
                    <p className="inventory-card-sub">{getCategory(item)}</p>
                    <p className="inventory-card-sub">
                      Updated {formatDateTime(item.lastUpdatedAt || item.updatedAt)}
                    </p>
                  </div>
                );
              })}
              </div>
            </>
          )}
        </section>
      </div>

      {newItemOpen && (
        <div className="customers-modal" role="dialog" aria-modal="true">
          <div className="customers-modal-panel admin-new-item-panel">
            <header>
              <div>
                <p className="admin-eyebrow">Quick add inventory</p>
                <h2>Add new items</h2>
                <p className="admin-subtitle">We’ll auto-generate SKUs and mark items active.</p>
              </div>
              <button
                type="button"
                className="customers-modal-close"
                onClick={() => {
                  setNewItemOpen(false);
                  setNewItemError("");
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <form className="admin-new-item-form" onSubmit={createInventoryItems}>
              {newItemRows.map((row, index) => (
                <div key={index} className="admin-new-item-row glass-card">
                  <div className="admin-new-item-row-head">
                    <span className="pill purple">Item {index + 1}</span>
                    {newItemRows.length > 1 && (
                      <button
                        type="button"
                        className="admin-chip"
                        onClick={() => removeNewItemRow(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="admin-form-grid">
                    <label>
                      Name
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateNewItemRow(index, "name", e.target.value)}
                        placeholder="e.g., Blue Party Cups"
                      />
                    </label>
                    <label>
                      Price (GHS)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        onChange={(e) => updateNewItemRow(index, "price", e.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      Quantity on hand
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.quantity}
                        onChange={(e) => updateNewItemRow(index, "quantity", e.target.value)}
                        placeholder="0"
                      />
                    </label>
                    <label>
                      Source category
                      <select
                        value={row.sourceCategoryCode}
                        onChange={(e) => updateNewItemRow(index, "sourceCategoryCode", e.target.value)}
                      >
                        <option value="CLOTHES">CLOTHES</option>
                        <option value="TOYS">TOYS</option>
                        <option value="RENTAL">RENTAL</option>
                      </select>
                    </label>
                    <label>
                      Specific category
                      <input
                        type="text"
                        value={row.specificCategory}
                        onChange={(e) => updateNewItemRow(index, "specificCategory", e.target.value)}
                        placeholder="e.g., Balloons"
                      />
                    </label>
                  </div>
                  <label>
                    Description
                    <textarea
                      rows="2"
                      value={row.description}
                      onChange={(e) => updateNewItemRow(index, "description", e.target.value)}
                      placeholder="Short description (optional)"
                    />
                  </label>
                </div>
              ))}

              <div className="admin-new-item-actions">
                <button type="button" className="admin-secondary" onClick={addNewItemRow}>
                  + Add another item
                </button>
                <div className="admin-new-item-actions-right">
                  <button
                    type="button"
                    className="bookings-secondary"
                    onClick={resetNewItemForm}
                    disabled={newItemSaving}
                  >
                    Reset
                  </button>
                  <button type="submit" className="bookings-primary" disabled={newItemSaving}>
                    {newItemSaving ? "Saving..." : "Create items"}
                  </button>
                </div>
              </div>
              {newItemError && <p className="admin-error">{newItemError}</p>}
            </form>
          </div>
        </div>
      )}

      {activeItem && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal-panel">
            <header>
              <div>
                <p className="admin-eyebrow">Adjust stock</p>
                <h2>{activeItem.name || "Untitled"}</h2>
                <span className="admin-modal-meta">ID {activeItem.id}</span>
              </div>
              {activeItem.image && (
                <div className="admin-modal-thumb">
                  <img src={activeItem.image} alt={activeItem.name || "Product image"} />
                </div>
              )}
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
