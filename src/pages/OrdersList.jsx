import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./master.css";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

const formatCurrency = (amount, currency = "GBP") => {
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

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

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
    if (!needle) return orders;
    return orders.filter((order) => {
      return (
        order.orderNumber?.toLowerCase().includes(needle) ||
        order.customerName?.toLowerCase().includes(needle) ||
        order.status?.toLowerCase().includes(needle)
      );
    });
  }, [orders, query]);

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

          {loading && <p className="orders-status">Loading orders...</p>}
          {!loading && error && <p className="orders-error">{error}</p>}

          {!loading && !error && (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Order date</th>
                    <th>Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber || `#${order.id}`}</td>
                      <td>{order.customerName || "-"}</td>
                      <td className={`orders-status-pill ${order.status || "pending"}`}>
                        {order.status || "pending"}
                      </td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td>{formatDate(order.deliveryDate)}</td>
                    </tr>
                  ))}
                  {!filteredOrders.length && (
                    <tr>
                      <td colSpan={6} className="orders-empty">
                        No orders match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default OrdersList;
