/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./master.css";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

const formatCurrency = (amount, currency = "GHS") => {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch (err) {
    return `£${Number(amount || 0).toFixed(2)}`;
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

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // table | cards
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [detailOrder, setDetailOrder] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/.netlify/functions/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch orders.");
        }
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load orders", err);
        setError("We couldn't load orders right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = orders.filter((order) => {
      if (statusFilter !== "all" && String(order.status || "").toLowerCase() !== statusFilter) {
        return false;
      }
      if (!needle) return true;
      return (
        order.orderNumber?.toLowerCase().includes(needle) ||
        order.customerName?.toLowerCase().includes(needle) ||
        order.status?.toLowerCase().includes(needle)
      );
    });
    return list;
  }, [orders, query, statusFilter]);

  const sortValue = (order, key) => {
    switch (key) {
      case "id":
        return Number(order.id) || 0;
      case "orderNumber":
        return (order.orderNumber || "").toLowerCase();
      case "customerName":
        return (order.customerName || "").toLowerCase();
      case "assignedUserName":
        return (order.assignedUserName || "").toLowerCase();
      case "status":
        return (order.status || "").toLowerCase();
      case "deliveryMethod":
        return (order.deliveryMethod || "").toLowerCase();
      case "total":
        return toNumber(order.total);
      case "orderDate":
        return new Date(order.orderDate || 0).getTime();
      case "deliveryDate":
        return new Date(order.deliveryDate || 0).getTime();
      case "lastModifiedAt":
        return new Date(order.lastModifiedAt || 0).getTime();
      default:
        return order[key] ?? "";
    }
  };

  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    const { key, direction } = sortConfig;
    list.sort((a, b) => {
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
      if (va < vb) return direction === "asc" ? -1 : 1;
      if (va > vb) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredOrders, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const paginatedOrders = useMemo(() => {
    const start = clampedPage * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, clampedPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter, viewMode, orders.length]);

  const totalAmount = useMemo(() => {
    return sortedOrders.reduce((sum, order) => sum + toNumber(order.total), 0);
  }, [sortedOrders]);

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

  return (
    <div className="orders-page">
      <div className="orders-shell">
        <AdminBreadcrumb items={[{ label: "Orders" }]} />
        <header className="orders-header">
          <div>
            <p className="orders-eyebrow">Orders</p>
            <h1>Order Ledger</h1>
            <p className="orders-subtitle">Review recent orders and jump into creation.</p>
          </div>
          <Link to="/admin/orders/new" className="orders-create">
            Create order
          </Link>
        </header>

        <section className="orders-panel">
          <div className="orders-panel-header">
            <div>
              <h3>All orders</h3>
              <span>{orders.length} total</span>
            </div>
            <label className="orders-search">
              Search
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order #, customer, status"
              />
            </label>
          </div>
          <div className="orders-controls">
            <div className="orders-control-group">
              <label className="orders-select">
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="canceled">Canceled</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
            <div className="orders-view-toggle" role="group" aria-label="Toggle orders view">
              <button
                type="button"
                className={`orders-chip ${viewMode === "table" ? "is-active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                type="button"
                className={`orders-chip ${viewMode === "cards" ? "is-active" : ""}`}
                onClick={() => setViewMode("cards")}
              >
                Cards
              </button>
            </div>
          </div>

          {loading && <p className="orders-status">Loading orders...</p>}
          {!loading && error && <p className="orders-error">{error}</p>}

          {!loading && !error && viewMode === "table" && (
            <div className="orders-table-wrapper">
              <div className="table-pagination">
                <span>
                  Showing {sortedOrders.length === 0 ? 0 : clampedPage * pageSize + 1}-
                  {Math.min(sortedOrders.length, (clampedPage + 1) * pageSize)} of {sortedOrders.length}
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
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("orderNumber")}>
                        Order <span className="sort-indicator">{sortIndicator("orderNumber")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("customerName")}>
                        Customer <span className="sort-indicator">{sortIndicator("customerName")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("assignedUserName")}>
                        Assigned to <span className="sort-indicator">{sortIndicator("assignedUserName")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("status")}>
                        Status <span className="sort-indicator">{sortIndicator("status")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("orderDate")}>
                        Order date <span className="sort-indicator">{sortIndicator("orderDate")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("deliveryDate")}>
                        Delivery <span className="sort-indicator">{sortIndicator("deliveryDate")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("deliveryMethod")}>
                        Fulfillment <span className="sort-indicator">{sortIndicator("deliveryMethod")}</span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-header" onClick={() => requestSort("total")}>
                        Total <span className="sort-indicator">{sortIndicator("total")}</span>
                      </button>
                    </th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setDetailOrder(order)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setDetailOrder(order);
                        }
                      }}
                    >
                      <td>{order.orderNumber || `#${order.id}`}</td>
                      <td>{order.customerName || "-"}</td>
                      <td>{formatUser(order.assignedUserName)}</td>
                      <td className={`orders-status-pill ${order.status || "pending"}`}>
                        {order.status || "pending"}
                      </td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td>{formatDate(order.deliveryDate)}</td>
                      <td className="orders-fulfillment">{(order.deliveryMethod || "delivery").toUpperCase()}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <div
                          className="bookings-menu inventory-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="bookings-edit"
                            aria-haspopup="true"
                            aria-expanded={openMenuId === `table-${order.id}`}
                            onClick={() =>
                              setOpenMenuId((prev) => (prev === `table-${order.id}` ? null : `table-${order.id}`))
                            }
                          >
                            ⋮
                          </button>
                          <div className={`bookings-menu-list ${openMenuId === `table-${order.id}` ? "open" : ""}`}>
                            <button type="button">Edit</button>
                            <button type="button">Mark fulfilled</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredOrders.length && (
                    <tr>
                      <td colSpan={8} className="orders-empty">
                        No orders match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="orders-total-row">
                    <td colSpan={7}>Total</td>
                    <td>{formatCurrency(totalAmount)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {!loading && !error && viewMode === "cards" && (
            <>
              <div className="table-pagination">
                <span>
                  Showing {sortedOrders.length === 0 ? 0 : clampedPage * pageSize + 1}-
                  {Math.min(sortedOrders.length, (clampedPage + 1) * pageSize)} of {sortedOrders.length}
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
              <div className="orders-card-grid">
                {!sortedOrders.length && <p className="orders-empty">No orders match your filters.</p>}
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="orders-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setDetailOrder(order);
                      }
                    }}
                  >
                    <div className="orders-card-head">
                      <span className={`orders-pill orders-status-pill ${order.status || "pending"}`}>
                        {order.status || "pending"}
                      </span>
                      <div
                        className="bookings-menu inventory-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="bookings-edit"
                          aria-haspopup="true"
                          aria-expanded={openMenuId === `card-${order.id}`}
                          onClick={() =>
                            setOpenMenuId((prev) => (prev === `card-${order.id}` ? null : `card-${order.id}`))
                          }
                        >
                          ⋮
                        </button>
                        <div className={`bookings-menu-list ${openMenuId === `card-${order.id}` ? "open" : ""}`}>
                          <button type="button">Edit</button>
                          <button type="button">Mark fulfilled</button>
                        </div>
                      </div>
                    </div>
                    <h4>{order.orderNumber || `#${order.id}`}</h4>
                    <p className="orders-card-meta">{order.customerName || "-"}</p>
                    <p className="orders-card-meta">
                      {formatDate(order.orderDate)} · Delivery {formatDate(order.deliveryDate)}
                    </p>
                    <p className="orders-card-meta">Fulfillment: {(order.deliveryMethod || "delivery").toUpperCase()}</p>
                    <p className="orders-card-meta">Assigned: {formatUser(order.assignedUserName)}</p>
                    <p className="orders-card-amount">{formatCurrency(order.total)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {detailOrder && (
          <div className="orders-detail-modal" role="dialog" aria-modal="true">
            <div className="orders-detail-panel">
              <header>
                <div>
                  <p className="orders-eyebrow">Order detail</p>
                  <h2>{detailOrder.orderNumber || `#${detailOrder.id}`}</h2>
                  <p className="orders-card-meta">{detailOrder.customerName || "-"}</p>
                </div>
                <button className="admin-close" onClick={() => setDetailOrder(null)} aria-label="Close detail">
                  Close
                </button>
              </header>
              <div className="orders-detail-body">
                <p>
                  Status:{" "}
                  <span className={`orders-status-pill ${detailOrder.status || "pending"}`}>
                    {detailOrder.status || "pending"}
                  </span>
                </p>
                <p>Total: {formatCurrency(detailOrder.total)}</p>
                <p>Fulfillment: {(detailOrder.deliveryMethod || "delivery").toUpperCase()}</p>
                <p>Order date: {formatDate(detailOrder.orderDate)}</p>
                <p>Delivery: {formatDate(detailOrder.deliveryDate)}</p>
                <p>Assigned: {formatUser(detailOrder.assignedUserName)}</p>
                <p>Last updated: {formatDateTime(detailOrder.lastModifiedAt)}</p>
                <div className="orders-detail-items">
                  <p className="orders-detail-items-title">Items</p>
                  {Array.isArray(detailOrder.items) && detailOrder.items.length > 0 ? (
                    <ul className="orders-detail-list">
                      {detailOrder.items.map((item) => (
                        <li key={item.id || `${item.productId}-${item.sku}`}>
                          {item.imageUrl && (
                            <span className="orders-detail-thumb">
                              <img src={item.imageUrl} alt={item.productName || item.sku || "Item"} />
                            </span>
                          )}
                          <div>
                            <p className="orders-detail-item-name">{item.productName || `Product ${item.productId}`}</p>
                            <p className="orders-detail-item-meta">
                              SKU {item.sku || "N/A"} · Qty {item.quantity}
                            </p>
                          </div>
                          <div className="orders-detail-item-total">
                            <span>{formatCurrency((item.unitPrice || 0) / 100)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="orders-empty">No items found for this order.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default OrdersList;
