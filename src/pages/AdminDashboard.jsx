/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faReceipt,
  faGear,
  faUsers,
  faChartPie,
  faCalendarDays,
  faHandshake,
  faCalendarCheck,
  faUserTie,
  faFileInvoiceDollar,
  faMoneyBillWave,
  faFolderOpen,
  faWrench,
  faUserAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./master.css";

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch (err) {
    return `GHS ${Math.round(amount || 0)}`;
  }
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError("");
      try {
        const response = await fetch("/.netlify/functions/orderStats");
        if (!response.ok) {
          throw new Error("Failed to load KPI data.");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load KPI data", err);
        setStatsError("Unable to load KPIs right now.");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const topProducts = useMemo(() => stats?.topProducts || [], [stats]);
  const windowLabel = stats?.windowDays ? `Last ${stats.windowDays} days` : "Last 30 days";

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-shell">
        <header className="admin-dashboard-header">
          <div>
            <p className="admin-dashboard-eyebrow">Admin</p>
            <h1>Control Center</h1>
            <p className="admin-dashboard-subtitle">
              Launch tools for stock, orders, and fulfillment.
            </p>
          </div>
        </header>

        <section className="admin-kpi">
          <div className="admin-kpi-header">
            <h2>Performance snapshot</h2>
            <span>{windowLabel}</span>
          </div>
          {loadingStats && <p className="admin-kpi-status">Loading KPIs...</p>}
          {!loadingStats && statsError && <p className="admin-kpi-error">{statsError}</p>}
          {!loadingStats && !statsError && (
            <div className="admin-kpi-stack">
              <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                  <p className="admin-kpi-label">Sales</p>
                  <h3 className="admin-kpi-value">{stats?.orders ?? 0}</h3>
                  <span className="admin-kpi-sub">Orders placed</span>
                </div>
                <div className="admin-kpi-card">
                  <p className="admin-kpi-label">Revenue</p>
                  <h3 className="admin-kpi-value">{formatCurrency(stats?.revenue ?? 0)}</h3>
                  <span className="admin-kpi-sub">Gross sales</span>
                </div>
                <div className="admin-kpi-card">
                  <p className="admin-kpi-label">Units sold</p>
                  <h3 className="admin-kpi-value">{stats?.units ?? 0}</h3>
                  <span className="admin-kpi-sub">Items shipped</span>
                </div>
              </div>
              <div className="admin-kpi-card admin-kpi-popular">
                <p className="admin-kpi-label">Popular products</p>
                {topProducts.length === 0 ? (
                  <p className="admin-kpi-sub">No product data yet.</p>
                ) : (
                  <ul className="admin-kpi-list">
                    {topProducts.map((product) => (
                      <li key={product.id}>
                        <span>{product.name || "Untitled"}</span>
                        <span>{product.units} sold</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="admin-app-grid">
          <div className="admin-app-slot">
            <Link to="/admin/inventory" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBoxOpen} />
              </span>
              <h2>Inventory</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/orders" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faReceipt} />
              </span>
              <h2>Orders</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/settings" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faGear} />
              </span>
              <h2>Settings</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/accounting" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faChartPie} />
              </span>
              <h2>Accounting</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/bookings" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faCalendarDays} />
              </span>
              <h2>Bookings</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/crm" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faHandshake} />
              </span>
              <h2>Directory</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/schedule" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </span>
              <h2>Scheduler</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/hr" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faUserTie} />
              </span>
              <h2>HR</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/invoicing" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
              </span>
              <h2>Invoicing</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/expenses" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </span>
              <h2>Expenses</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/documents" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFolderOpen} />
              </span>
              <h2>Documents</h2>
            </Link>
          </div>

          <div className="admin-app-slot">
            <Link to="/admin/maintenance" className="admin-app-link">
              <span className="admin-app-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faWrench} />
              </span>
              <h2>Maintenance</h2>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
