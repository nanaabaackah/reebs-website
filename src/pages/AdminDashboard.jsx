/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../components/AuthContext";

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

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [userStatsError, setUserStatsError] = useState("");
  const [loadingUserStats, setLoadingUserStats] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState({ orders: [], bookings: [], stockMovements: [] });
  const [userDetailsLoaded, setUserDetailsLoaded] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState("");
  const [selectedUserStat, setSelectedUserStat] = useState("");
  const roleKey = (user?.role || "admin").toLowerCase();
  const effectiveRole = roleKey === "manager" ? "admin" : roleKey;
  const showGlobalKpis = effectiveRole === "admin"; // admin + manager
  const showPersonalKpis = roleKey !== "admin"; // staff, warehouse, manager

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const defaultUserStats = { orders: 0, orderRevenue: 0, bookings: 0, bookingRevenue: 0, stockMovements: 0 };

  const applyUserStats = (payload) => {
    if (!payload) return;
    setUserStats({
      orders: toNumber(payload.orders),
      orderRevenue: toNumber(payload.orderRevenue),
      bookings: toNumber(payload.bookings),
      bookingRevenue: toNumber(payload.bookingRevenue),
      stockMovements: toNumber(payload.stockMovements),
    });
  };

  const fetchUserStats = async (includeDetails = false) => {
    if (!user?.id) return;
    if (includeDetails) {
      setLoadingUserDetails(true);
      setUserDetailsError("");
    } else {
      setLoadingUserStats(true);
      setUserStatsError("");
    }

    try {
      const response = await fetch(
        `/.netlify/functions/userStats?userId=${user.id}${includeDetails ? "&details=1" : ""}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load your KPIs");

      applyUserStats(data);

      if (includeDetails) {
        setUserDetails({
          orders: Array.isArray(data?.details?.orders) ? data.details.orders : [],
          bookings: Array.isArray(data?.details?.bookings) ? data.details.bookings : [],
          stockMovements: Array.isArray(data?.details?.stockMovements) ? data.details.stockMovements : [],
        });
        setUserDetailsLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load user stats", err);
      applyUserStats(userStats || defaultUserStats);
      if (includeDetails) {
        setUserDetailsError(err.message || "Failed to load your KPI details");
        setUserDetailsLoaded(false);
        setUserDetails({ orders: [], bookings: [], stockMovements: [] });
      } else {
        setUserStatsError(err.message || "Failed to load your KPIs");
      }
    } finally {
      if (includeDetails) {
        setLoadingUserDetails(false);
      } else {
        setLoadingUserStats(false);
      }
    }
  };

  const normalizeStats = useCallback((payload) => {
    if (!payload) return null;
    const list = (items, mapFn) => (Array.isArray(items) ? items.map(mapFn) : []);
    return {
      windowDays: payload.windowDays ?? 30,
      orders: toNumber(payload.orders),
      revenue: toNumber(payload.revenue),
      units: toNumber(payload.units),
      bookings: toNumber(payload.bookings),
      bookingRevenue: toNumber(payload.bookingRevenue),
      lockedInNextQuarter: toNumber(payload.lockedInNextQuarter),
      nextQuarterLabel: payload.nextQuarterLabel || "Next quarter",
      conflicts: Array.isArray(payload.conflicts) ? payload.conflicts : [],
      topRentalBookings: list(payload.topRentalBookings, (row) => ({
        ...row,
        units: toNumber(row.units),
        revenue: toNumber(row.revenue),
      })),
      topProducts: list(payload.topProducts, (row) => ({
        ...row,
        units: toNumber(row.units),
      })),
    };
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError("");
    try {
      const response = await fetch("/.netlify/functions/orderStats");
      if (!response.ok) {
        throw new Error("Failed to load KPI data.");
      }
      const data = await response.json();
      setStats(normalizeStats(data));
    } catch (err) {
      console.error("Failed to load KPI data", err);
      setStatsError(err.message || "Unable to load KPIs right now.");
    } finally {
      setLoadingStats(false);
    }
  }, [normalizeStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setUserDetails({ orders: [], bookings: [], stockMovements: [] });
    setUserDetailsLoaded(false);
    setUserDetailsError("");
    setSelectedUserStat("");
    setLoadingUserDetails(false);
    setUserStats(defaultUserStats);
    fetchUserStats(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, roleKey]);

  const topProducts = useMemo(() => stats?.topProducts || [], [stats]);
  const windowLabel = stats?.windowDays ? `Last ${stats.windowDays} days` : "Last 30 days";
  const lockedInNextQuarter = formatCurrency(stats?.lockedInNextQuarter || 0);
  const nextQuarterLabel = stats?.nextQuarterLabel || "Next quarter";
  const topRental = stats?.topRentalBookings?.[0];
  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.name ||
    user?.lastName ||
    (user?.email ? user.email.split("@")[0] : "") ||
    user?.role ||
    "User";

  const apps = [
    { label: "Inventory", path: "/admin/inventory", icon: faBoxOpen, roles: ["admin", "staff", "warehouse", "manager"] },
    { label: "Orders", path: "/admin/orders", icon: faReceipt, roles: ["admin", "staff", "manager"] },
    { label: "Settings", path: "/admin/settings", icon: faGear, roles: ["admin", "staff", "manager"] },
    { label: "Accounting", path: "/admin/accounting", icon: faChartPie, roles: ["admin", "manager"] },
    { label: "Bookings", path: "/admin/bookings", icon: faCalendarDays, roles: ["admin", "staff", "manager"] },
    { label: "Directory", path: "/admin/crm", icon: faHandshake, roles: ["admin", "staff", "manager"] },
    { label: "Scheduler", path: "/admin/schedule", icon: faCalendarCheck, roles: ["admin", "staff", "manager"] },
    { label: "HR", path: "/admin/hr", icon: faUserTie, roles: ["admin", "manager"] },
    { label: "Invoicing", path: "/admin/invoicing", icon: faFileInvoiceDollar, roles: ["admin", "manager"] },
    { label: "Expenses", path: "/admin/expenses", icon: faMoneyBillWave, roles: ["admin", "staff", "manager"] },
    { label: "Documents", path: "/admin/documents", icon: faFolderOpen, roles: ["admin", "staff", "manager"] },
    { label: "Users", path: "/admin/roles", icon: faUserAlt, roles: ["admin", "manager"] },
    { label: "Maintenance", path: "/admin/maintenance", icon: faWrench, roles: ["admin", "staff", "manager"] },
  ];

  const visibleApps = apps.filter((app) => app.roles.includes(effectiveRole));
  const conflictText = useMemo(() => {
    const conflicts = stats?.conflicts || [];
    if (!conflicts.length) return "No inventory conflicts detected.";
    const first = conflicts[0];
    const bookingList = Array.isArray(first.booking_ids)
      ? first.booking_ids.map((id) => `#${id}`).join(", ")
      : "";
    const shortDate = first.event_date ? new Date(first.event_date).toLocaleDateString("en-GB") : "";
    const extra = conflicts.length > 1 ? ` + ${conflicts.length - 1} more conflict(s)` : "";
    return `Product #${first.product_id} (${first.product_name || "Item"}) needs ${first.total_quantity} on ${shortDate} with only ${first.product_stock ?? 0} in stock. Bookings: ${bookingList}${extra}`;
  }, [stats]);

  const personalStatMeta = {
    orders: {
      label: "Sales you closed",
      sub: (value) => formatCurrency(value),
      detailTitle: "Orders assigned to you",
      empty: "No orders assigned to you yet.",
    },
    stockMovements: {
      label: "Inventory logged",
      sub: () => "Stock entries you added",
      detailTitle: "Inventory you entered",
      empty: "No inventory movements recorded for you.",
    },
    bookings: {
      label: "Bookings handled",
      sub: (value) => formatCurrency(value),
      detailTitle: "Bookings assigned to you",
      empty: "No bookings assigned to you yet.",
    },
  };

  const selectedUserDetails = useMemo(() => {
    switch (selectedUserStat) {
      case "orders":
        return userDetails.orders || [];
      case "bookings":
        return userDetails.bookings || [];
      case "stockMovements":
        return userDetails.stockMovements || [];
      default:
        return [];
    }
  }, [selectedUserStat, userDetails]);

  const handlePersonalCardClick = async (statKey) => {
    if (selectedUserStat === statKey) {
      setSelectedUserStat("");
      return;
    }
    setSelectedUserStat(statKey);
    if (!userDetailsLoaded && !loadingUserDetails) {
      await fetchUserStats(true);
    }
  };

  const renderDetailList = (statKey, items) => {
    if (statKey === "orders") {
      return (
        <ul className="admin-kpi-detail-list">
          {items.map((order) => (
            <li key={`order-${order.id}`} className="admin-kpi-detail-item">
              <div>
                <p className="admin-kpi-detail-title">{order.orderNumber || `Order #${order.id}`}</p>
                <p className="admin-kpi-detail-sub">{order.customerName || "No customer"}</p>
              </div>
              <div className="admin-kpi-detail-meta">
                <span className="admin-kpi-chip">{order.status || "pending"}</span>
                <span>{formatCurrency(toNumber(order.total))}</span>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (statKey === "bookings") {
      return (
        <ul className="admin-kpi-detail-list">
          {items.map((booking) => {
            const total = toNumber(booking.totalAmount, 0) / 100;
            const hasTime = booking.startTime || booking.endTime;
            const timeRange = hasTime ? `${booking.startTime || "TBD"} - ${booking.endTime || "TBD"}` : "Time not set";
            return (
              <li key={`booking-${booking.id}`} className="admin-kpi-detail-item">
                <div>
                  <p className="admin-kpi-detail-title">Booking #{booking.id}</p>
                  <p className="admin-kpi-detail-sub">
                    {booking.customerName || "No customer"} · {timeRange}
                  </p>
                </div>
                <div className="admin-kpi-detail-meta">
                  <span className="admin-kpi-chip">{booking.status || "pending"}</span>
                  <span>{formatCurrency(total)}</span>
                  <span>{formatDate(booking.eventDate)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    if (statKey === "stockMovements") {
      return (
        <ul className="admin-kpi-detail-list">
          {items.map((movement) => (
            <li key={`movement-${movement.id}`} className="admin-kpi-detail-item">
              <div>
                <p className="admin-kpi-detail-title">
                  {movement.type || "Stock"} · {movement.productName || `Product ${movement.productId}`}
                </p>
                <p className="admin-kpi-detail-sub">
                  Qty {toNumber(movement.quantity)} · {movement.reference || "No reference"}
                </p>
              </div>
              <div className="admin-kpi-detail-meta">
                <span>{formatDateTime(movement.date || movement.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    return null;
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-shell">
        <header className="admin-dashboard-header">
          <div>
            <p className="admin-dashboard-eyebrow">Dashboard</p>
            <h1>
              Welcome, {displayName}
            </h1>
            <p className="admin-dashboard-subtitle">
              Launch tools for stock, orders, and fulfillment.
            </p>
          </div>
        </header>

        {showGlobalKpis && (
          <section className="admin-kpi">
            <div className="admin-kpi-header">
              <h2>Performance snapshot</h2>
              <span>{windowLabel}</span>
            </div>
            {loadingStats && <p className="admin-kpi-status">Loading KPIs...</p>}
            {!loadingStats && statsError && (
              <div className="admin-kpi-inline">
                <p className="admin-kpi-error">{statsError}</p>
                <button type="button" className="admin-kpi-retry" onClick={fetchStats}>
                  Retry
                </button>
              </div>
            )}
            {!loadingStats && !statsError && (
              <div className="admin-kpi-stack">
                <div className="admin-kpi-grid">
                  <Link to="/admin/orders" className="admin-kpi-card admin-kpi-link-card">
                    <p className="admin-kpi-label">Sales</p>
                    <h3 className="admin-kpi-value">{stats?.orders ?? 0}</h3>
                    <span className="admin-kpi-sub">Orders placed</span>
                  </Link>
                  <Link to="/admin/accounting" className="admin-kpi-card admin-kpi-link-card">
                    <p className="admin-kpi-label">Revenue</p>
                    <h3 className="admin-kpi-value">{formatCurrency(stats?.revenue ?? 0)}</h3>
                    <span className="admin-kpi-sub">Gross sales</span>
                  </Link>
                  <Link to="/admin/orders" className="admin-kpi-card admin-kpi-link-card">
                    <p className="admin-kpi-label">Units sold</p>
                    <h3 className="admin-kpi-value">{stats?.units ?? 0}</h3>
                    <span className="admin-kpi-sub">Items shipped</span>
                  </Link>
                  <Link to="/admin/bookings" className="admin-kpi-card admin-kpi-link-card">
                    <p className="admin-kpi-label">Bookings</p>
                    <h3 className="admin-kpi-value">{stats?.bookings ?? 0}</h3>
                    <span className="admin-kpi-sub">{formatCurrency(stats?.bookingRevenue ?? 0)}</span>
                  </Link>
                </div>
                <Link to="/admin/inventory" className="admin-kpi-card admin-kpi-popular admin-kpi-link-card">
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
                </Link>
                <div className="admin-kpi-notes">
                  <div className="admin-kpi-note">
                    <div>
                      <p className="admin-kpi-label">Cash Flow Projection</p>
                      <p className="admin-kpi-note-value">{lockedInNextQuarter}</p>
                      <p className="admin-kpi-sub">Confirmed bookings for {nextQuarterLabel}.</p>
                    </div>
                  </div>
                  <div className="admin-kpi-note">
                    <div>
                      <p className="admin-kpi-label">Inventory Conflicts</p>
                      <p className="admin-kpi-sub">{conflictText}</p>
                    </div>
                  </div>
                  <div className="admin-kpi-note">
                    <div>
                      <p className="admin-kpi-label">Top booked rental</p>
                      {topRental ? (
                        <>
                          <p className="admin-kpi-note-value">{topRental.name || "Untitled"}</p>
                          <p className="admin-kpi-sub">
                            {topRental.units} units · {topRental.sku ? `SKU ${topRental.sku}` : "No SKU"} · {formatCurrency(topRental.revenue)}
                          </p>
                        </>
                      ) : (
                        <p className="admin-kpi-sub">No recent rental bookings.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {showPersonalKpis && (
          <section className="admin-kpi">
            <div className="admin-kpi-header">
              <h2>Your activity</h2>
              <span>Role: {user?.role || "Staff"}</span>
            </div>
            {loadingUserStats && <p className="admin-kpi-status">Loading your KPIs...</p>}
            {!loadingUserStats && (
              <div className="admin-kpi-inline">
                <p className="admin-kpi-subtle">Tap a stat to see your items.</p>
                {userStatsError && (
                  <>
                    <span className="admin-kpi-error">{userStatsError}</span>
                    <button type="button" className="admin-kpi-retry" onClick={() => fetchUserStats(false)}>
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="admin-kpi-stack">
              <div className="admin-kpi-grid">
                <button
                  type="button"
                  className={`admin-kpi-card admin-kpi-card-button ${
                    selectedUserStat === "orders" ? "is-active" : ""
                  }`}
                  onClick={() => handlePersonalCardClick("orders")}
                >
                  <p className="admin-kpi-label">{personalStatMeta.orders.label}</p>
                  <h3 className="admin-kpi-value">{userStats?.orders ?? 0}</h3>
                  <span className="admin-kpi-sub">{personalStatMeta.orders.sub(userStats?.orderRevenue ?? 0)}</span>
                </button>
                <button
                  type="button"
                  className={`admin-kpi-card admin-kpi-card-button ${
                    selectedUserStat === "stockMovements" ? "is-active" : ""
                  }`}
                  onClick={() => handlePersonalCardClick("stockMovements")}
                >
                  <p className="admin-kpi-label">{personalStatMeta.stockMovements.label}</p>
                  <h3 className="admin-kpi-value">{userStats?.stockMovements ?? 0}</h3>
                  <span className="admin-kpi-sub">{personalStatMeta.stockMovements.sub()}</span>
                </button>
                <button
                  type="button"
                  className={`admin-kpi-card admin-kpi-card-button ${
                    selectedUserStat === "bookings" ? "is-active" : ""
                  }`}
                  onClick={() => handlePersonalCardClick("bookings")}
                >
                  <p className="admin-kpi-label">{personalStatMeta.bookings.label}</p>
                  <h3 className="admin-kpi-value">{userStats?.bookings ?? 0}</h3>
                  <span className="admin-kpi-sub">{personalStatMeta.bookings.sub(userStats?.bookingRevenue ?? 0)}</span>
                </button>
              </div>
              {selectedUserStat && (
                <div className="admin-kpi-detail">
                  <div className="admin-kpi-detail-header">
                    <div>
                      <p className="admin-kpi-label">{personalStatMeta[selectedUserStat].detailTitle}</p>
                      <h3 className="admin-kpi-detail-title-lg">
                        {personalStatMeta[selectedUserStat].detailTitle}
                      </h3>
                    </div>
                    {loadingUserDetails && <span className="admin-kpi-status">Loading…</span>}
                  </div>
                  {userDetailsError && (
                    <div className="admin-kpi-inline">
                      <p className="admin-kpi-error">{userDetailsError}</p>
                      <button
                        type="button"
                        className="admin-kpi-retry"
                        onClick={() => fetchUserStats(true)}
                        disabled={loadingUserDetails}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {loadingUserDetails && !userDetailsError && <p className="admin-kpi-status">Fetching your data…</p>}
                  {!loadingUserDetails && !userDetailsError && selectedUserDetails.length === 0 && (
                    <p className="admin-kpi-status">{personalStatMeta[selectedUserStat].empty}</p>
                  )}
                  {!loadingUserDetails && !userDetailsError && selectedUserDetails.length > 0 && (
                    <div className="admin-kpi-detail-body">{renderDetailList(selectedUserStat, selectedUserDetails)}</div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="admin-app-grid">
          {visibleApps.map((app) => (
            <div className="admin-app-slot" key={app.path}>
              <Link to={app.path} className="admin-app-link">
                <span className="admin-app-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={app.icon} />
                </span>
                <h2>{app.label}</h2>
              </Link>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
