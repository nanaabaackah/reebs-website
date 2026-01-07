/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import AdminBreadcrumb from "../components/AdminBreadcrumb";
import "./master.css";

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
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

function AdminAccounting() {
  const [windowKey, setWindowKey] = useState("allTime");
  const [viewMode, setViewMode] = useState("overview"); // overview | charts | kanban | list | taxes
  const [data, setData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [error, setError] = useState("");
  const [financeError, setFinanceError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [listLoaded, setListLoaded] = useState(false);
  const [taxConfig, setTaxConfig] = useState({ taxRate: "0" });
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
  );

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const handleChange = () => setIsMobileView(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (isMobileView && viewMode === "list") {
      setViewMode("overview");
    }
  }, [isMobileView, viewMode]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("reebs_erp_config");
      if (stored) {
        setTaxConfig((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      setTaxConfig({ taxRate: "0" });
    }
  }, []);

  const parseTaxRate = (value) => {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return raw > 1 ? raw / 100 : raw;
  };

  const fetchJson = async (url) => {
    const res = await fetch(url);
    const text = await res.text();
    const json = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })();
    if (!res.ok) throw new Error(json?.error || "Failed to load data.");
    return json;
  };

  const fetchData = async (key = windowKey) => {
    if (!data) setLoading(true);
    if (!financeData) setFinanceLoading(true);
    setIsFetching(true);
    setError("");
    setFinanceError("");
    try {
      const [financialResult, financeResult] = await Promise.allSettled([
        fetchJson(`/.netlify/functions/financials?window=${key}`),
        fetchJson(`/.netlify/functions/finance?window=${key}`),
      ]);

      if (financialResult.status === "fulfilled") {
        setData(financialResult.value);
      } else {
        setError(financialResult.reason?.message || "Failed to load financial stats.");
      }

      if (financeResult.status === "fulfilled") {
        setFinanceData(financeResult.value);
      } else {
        setFinanceError(financeResult.reason?.message || "Failed to reconcile finance data.");
      }
    } catch (err) {
      console.error("Financials failed", err);
      setError(err.message || "Unable to load financial stats.");
    } finally {
      setLoading(false);
      setFinanceLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData("allTime");
  }, []);

  const fetchListData = async () => {
    setListLoading(true);
    setListError("");
    try {
      const [ordersRes, bookingsRes] = await Promise.all([
        fetchJson("/.netlify/functions/orders"),
        fetchJson("/.netlify/functions/bookings"),
      ]);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setListLoaded(true);
    } catch (err) {
      console.error("List fetch failed", err);
      setListError(err.message || "Unable to load receipts and invoices.");
      setListLoaded(false);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (isMobileView && viewMode === "list") return;
    if (viewMode !== "list" && viewMode !== "taxes") return;
    if (listLoaded) return;
    fetchListData();
  }, [viewMode, listLoaded, isMobileView]);

  const revenueSplit = useMemo(() => {
    const retail = data?.revenueByCategory?.retail || 0;
    const rental = data?.revenueByCategory?.rental || 0;
    const other = data?.revenueByCategory?.other || 0;
    const total = retail + rental + other || 1;
    return {
      retail,
      rental,
      other,
      retailPct: Math.round((retail / total) * 100),
      rentalPct: Math.round((rental / total) * 100),
      otherPct: Math.round((other / total) * 100),
    };
  }, [data]);

  const cashflowTrend = useMemo(() => data?.cashflow || [], [data]);
  const topProducts = useMemo(() => data?.topProducts || [], [data]);
  const totalRevenue = useMemo(() => data?.revenue || 0, [data]);
  const topProductsMax = useMemo(() => Math.max(...topProducts.map((p) => p.revenue || 0), 0), [topProducts]);
  const topRentals = useMemo(() => data?.topRentals || [], [data]);
  const topRentalsMax = useMemo(() => Math.max(...topRentals.map((p) => p.revenue || 0), 0), [topRentals]);
  const financeSummary = useMemo(() => financeData?.summary || null, [financeData]);
  const expenseWindowLabel = financeData?.expenseWindowLabel || data?.windowLabel || "";
  const financeTransactions = useMemo(() => financeData?.transactions || [], [financeData]);

  const windowStart = data?.startDate ? new Date(data.startDate) : null;
  const windowEnd = data?.endDate ? new Date(data.endDate) : null;
  const withinWindow = (value) => {
    if (!windowStart || !windowEnd) return true;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= windowStart && date < windowEnd;
  };

  const filteredOrders = useMemo(
    () => orders.filter((order) => withinWindow(order.orderDate)),
    [orders, windowStart, windowEnd]
  );

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => withinWindow(booking.eventDate)),
    [bookings, windowStart, windowEnd]
  );

  const listRows = useMemo(() => {
    const orderRows = filteredOrders.map((order) => ({
      id: `order-${order.id}`,
      type: "Receipt",
      number: order.orderNumber || `ORD-${order.id}`,
      customer: order.customerName || "-",
      date: order.orderDate,
      status: order.status || "pending",
      total: Number(order.total || 0),
    }));
    const bookingRows = filteredBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: "Invoice",
      number: `INV-${booking.id}`,
      customer: booking.customerName || "-",
      date: booking.eventDate,
      status: booking.status || "pending",
      total: Number(booking.totalAmount || 0) / 100,
    }));
    return [...orderRows, ...bookingRows].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredOrders, filteredBookings]);

  const receiptsTotal = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [filteredOrders]
  );
  const invoicesTotal = useMemo(
    () => filteredBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0) / 100, 0),
    [filteredBookings]
  );
  const combinedTotal = receiptsTotal + invoicesTotal;
  const taxRate = parseTaxRate(taxConfig?.taxRate);
  const taxDue = combinedTotal * taxRate;
  const taxLabel = `${Math.round(taxRate * 100)}%`;
  const cashflowSpark = useMemo(() => {
    if (!cashflowTrend.length) return { points: "", max: 0 };
    const max = Math.max(...cashflowTrend.map((d) => d.revenue || 0), 0);
    if (max <= 0) return { points: "", max };
    const n = cashflowTrend.length;
    const points = cashflowTrend
      .map((entry, index) => {
        const x = (index / Math.max(1, n - 1)) * 100;
        const y = 100 - Math.min(100, (entry.revenue / max) * 100);
        return `${x},${y}`;
      })
      .join(" ");
    return { points, max };
  }, [cashflowTrend]);

  return (
    <div className="accounting-page">
      <div className="accounting-shell">
        <AdminBreadcrumb items={[{ label: "Accounting" }]} />

        <header className="accounting-header">
          <div>
            <p className="accounting-eyebrow">Financial Intelligence</p>
            <h1>Accounting</h1>
            <p className="accounting-subtitle">
              Move from recording data to understanding profit: revenue mix, top sellers, and cash flow trends.
            </p>
          </div>
          <div className="accounting-filters">
            <div className="accounting-filters-left">
              <label className="accounting-filter">
                Date filter
                <select
                  value={windowKey}
                  onChange={(event) => {
                    const next = event.target.value;
                    setWindowKey(next);
                    fetchData(next);
                  }}
                >
                  <option value="today">Today</option>
                  <option value="allTime">All time</option>
                  <option value="thisMonth">This month</option>
                  <option value="lastMonth">Last month</option>
                  <option value="thisQuarter">This quarter</option>
                  <option value="lastQuarter">Last quarter</option>
                  <option value="thisYear">This year</option>
                  <option value="lastYear">Last year</option>
                </select>
              </label>
              <label className="accounting-filter">
                Custom
                <select
                  onChange={(event) => {
                    const preset = event.target.value;
                    if (!preset) return;
                    // custom presets reuse existing windows for speed; more can be added here
                    if (preset === "holiday") fetchData("lastYear");
                    if (preset === "flash") fetchData("today");
                  }}
                >
                  <option value="">Compare…</option>
                  <option value="holiday">Holiday season (last year)</option>
                  <option value="flash">Weekend flash sale (today)</option>
                </select>
              </label>
            </div>
            <div className="accounting-right">
              <div className="accounting-views">
                <div className="accounting-tabs" role="tablist" aria-label="Accounting view">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "overview"}
                    className={viewMode === "overview" ? "is-active" : ""}
                    onClick={() => setViewMode("overview")}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "charts"}
                    className={viewMode === "charts" ? "is-active" : ""}
                    onClick={() => setViewMode("charts")}
                  >
                    Charts
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "kanban"}
                    className={viewMode === "kanban" ? "is-active" : ""}
                    onClick={() => setViewMode("kanban")}
                  >
                    Kanban
                  </button>
                  {!isMobileView && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "list"}
                      className={viewMode === "list" ? "is-active" : ""}
                      onClick={() => setViewMode("list")}
                    >
                      List
                    </button>
                  )}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "taxes"}
                    className={viewMode === "taxes" ? "is-active" : ""}
                    onClick={() => setViewMode("taxes")}
                  >
                    Taxes
                  </button>
                </div>
              </div>
              <div className="accounting-actions">
                <button type="button" className="accounting-secondary" onClick={() => fetchData(windowKey)}>
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {loading && <p className="accounting-status">Loading financial metrics…</p>}
        {!loading && isFetching && data && (
          <p className="accounting-status">Refreshing calculations…</p>
        )}
        {!loading && error && (
          <div className="accounting-inline">
            <p className="accounting-error">{error}</p>
            <button type="button" className="accounting-secondary" onClick={() => fetchData(windowKey)}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && viewMode === "overview" && (
          <>
            <section className="accounting-kpis">
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Gross revenue</p>
                <h3 className="accounting-kpi-value">{formatCurrency(data.revenue || 0)}</h3>
                <p className="accounting-kpi-sub">Orders: {data.orders || 0}</p>
              </div>
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Units sold</p>
                <h3 className="accounting-kpi-value">{data.units || 0}</h3>
                <p className="accounting-kpi-sub">{data.windowLabel || ""}</p>
              </div>
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Cash flow trend</p>
                <h3 className="accounting-kpi-value">
                  {cashflowTrend.length ? `${cashflowTrend.length} day${cashflowTrend.length > 1 ? "s" : ""}` : "No data"}
                </h3>
                <p className="accounting-kpi-sub">Daily revenue in {data.windowLabel || ""}</p>
              </div>
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Bookings revenue</p>
                <h3 className="accounting-kpi-value">{formatCurrency(data.bookingRevenue || 0)}</h3>
                <p className="accounting-kpi-sub">{data.bookings || 0} bookings</p>
              </div>
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Operating expenses</p>
                <h3 className="accounting-kpi-value">
                  {formatCurrency(financeSummary?.operatingExpenses || 0)}
                </h3>
                <p className="accounting-kpi-sub">{expenseWindowLabel}</p>
              </div>
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Net profit</p>
                <h3 className="accounting-kpi-value">
                  {formatCurrency(financeSummary?.netProfit || 0)}
                </h3>
                <p className="accounting-kpi-sub">After operating expenses</p>
              </div>
            </section>

            <section className="accounting-panels accounting-panels-stack">
              <div className="accounting-panel accounting-panel--margins">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Automated reconciliation</p>
                    <h3>Profit & loss snapshot</h3>
                    <p className="accounting-panel-sub">COGS uses purchase prices to reveal true gross profit.</p>
                  </div>
                </div>
                {financeLoading && !financeSummary ? (
                  <p className="accounting-muted">Reconciling ledgers…</p>
                ) : financeError && !financeSummary ? (
                  <p className="accounting-error">{financeError}</p>
                ) : financeSummary ? (
                  <div className="accounting-pnl">
                    <div className="accounting-pnl-row">
                      <span>Retail sales revenue</span>
                      <span>{formatCurrency(financeSummary.revenue)}</span>
                    </div>
                    <div className="accounting-pnl-row">
                      <span>Rental income (events)</span>
                      <span>{formatCurrency(financeSummary.rentalIncome)}</span>
                    </div>
                    <div className="accounting-pnl-row accounting-negative">
                      <span>Cost of goods sold</span>
                      <span>-{formatCurrency(financeSummary.cogs)}</span>
                    </div>
                    <div className="accounting-pnl-row">
                      <span>Gross profit</span>
                      <span>{formatCurrency(financeSummary.grossProfit)}</span>
                    </div>
                    <div className="accounting-pnl-row accounting-negative">
                      <span>Operating expenses</span>
                      <span>-{formatCurrency(financeSummary.operatingExpenses)}</span>
                    </div>
                    <div className="accounting-pnl-row total">
                      <strong>Net profit</strong>
                      <strong>{formatCurrency(financeSummary.netProfit)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="accounting-muted">No reconciliation data in this window.</p>
                )}
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Sales reconciliation</p>
                    <h3>Margins by product</h3>
                    <p className="accounting-panel-sub">Margins show where profit is strongest.</p>
                  </div>
                </div>
                {financeLoading && !financeTransactions.length ? (
                  <p className="accounting-muted">Calculating product margins…</p>
                ) : financeError && !financeTransactions.length ? (
                  <p className="accounting-error">{financeError}</p>
                ) : financeTransactions.length === 0 ? (
                  <p className="accounting-muted">No sales items in this window.</p>
                ) : (
                  <div className="accounting-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Revenue</th>
                          <th>Unit cost</th>
                          <th>Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financeTransactions.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="accounting-table-title">
                                <strong>{item.name || "Untitled"}</strong>
                                <span>{item.sku ? `SKU ${item.sku}` : "No SKU"} · {item.qty} units</span>
                              </div>
                            </td>
                            <td>{formatCurrency(item.revenue)}</td>
                            <td>{formatCurrency(item.unitCost)}</td>
                            <td className={item.marginPct >= 0 ? "accounting-positive" : "accounting-negative"}>
                              {item.marginPct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="accounting-panels">
              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Income diversification</p>
                    <h3>Retail vs. Rentals</h3>
                    <p className="accounting-panel-sub">
                      Track mix to decide where to promote. Retail {revenueSplit.retailPct}% / Rentals {revenueSplit.rentalPct}%.
                    </p>
                  </div>
                </div>
                <div className="accounting-split-bar">
                  <span
                    className="accounting-split retail"
                    style={{ width: `${Math.max(revenueSplit.retailPct, 1)}%` }}
                    title={`Retail ${formatCurrency(revenueSplit.retail)}`}
                  />
                  <span
                    className="accounting-split rental"
                    style={{ width: `${Math.max(revenueSplit.rentalPct, 1)}%` }}
                    title={`Rentals ${formatCurrency(revenueSplit.rental)}`}
                  />
                  {revenueSplit.otherPct > 0 && (
                    <span
                      className="accounting-split other"
                      style={{ width: `${Math.max(revenueSplit.otherPct, 1)}%` }}
                      title={`Other ${formatCurrency(revenueSplit.other)}`}
                    />
                  )}
                </div>
                <div className="accounting-split-legend">
                  <div>
                    <span className="dot retail" /> Retail {formatCurrency(revenueSplit.retail)}
                  </div>
                  <div>
                    <span className="dot rental" /> Rentals {formatCurrency(revenueSplit.rental)}
                  </div>
                  {revenueSplit.other > 0 && (
                    <div>
                      <span className="dot other" /> Other {formatCurrency(revenueSplit.other)}
                    </div>
                  )}
                </div>
                <p className="accounting-hint">
                  If retail is lagging rentals, consider a shop promotion to balance revenue.
                </p>
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Top selling products</p>
                    <h3>Leaders this period</h3>
                    <p className="accounting-panel-sub">Shows the highest earners by revenue.</p>
                  </div>
                </div>
                {topProducts.length === 0 ? (
                  <p className="accounting-muted">No products sold in this window.</p>
                ) : (
                  <ul className="accounting-list">
                    {topProducts.map((product) => (
                      <li key={product.id}>
                        <div>
                          <strong>{product.name || "Untitled"}</strong>
                          <p className="accounting-muted">{product.sku ? `SKU ${product.sku}` : "No SKU"}</p>
                        </div>
                        <div className="accounting-list-meta">
                          <span>{formatCurrency(product.revenue)}</span>
                          <span>{product.units} units</span>
                          {topProductsMax > 0 && (
                            <div className="accounting-list-bar">
                              <span
                                style={{
                                  width: `${Math.max(
                                    6,
                                    (product.revenue / Math.max(totalRevenue, topProductsMax || 1)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Top booked rentals</p>
                    <h3>Rental leaders</h3>
                    <p className="accounting-panel-sub">Confirmed bookings in this window.</p>
                  </div>
                </div>
                {topRentals.length === 0 ? (
                  <p className="accounting-muted">No rentals booked in this window.</p>
                ) : (
                  <ul className="accounting-list">
                    {topRentals.map((rental) => (
                      <li key={rental.id}>
                        <div>
                          <strong>{rental.name || "Untitled"}</strong>
                          <p className="accounting-muted">{rental.sku ? `SKU ${rental.sku}` : "No SKU"}</p>
                        </div>
                        <div className="accounting-list-meta">
                          <span>{formatCurrency(rental.revenue)}</span>
                          <span>{rental.units} units</span>
                          {topRentalsMax > 0 && (
                            <div className="accounting-list-bar">
                              <span
                                style={{
                                  width: `${Math.max(
                                    6,
                                    (rental.revenue / Math.max(data.bookingRevenue || 0, topRentalsMax || 1)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Cash flow trend</p>
                    <h3>Daily revenue</h3>
                    <p className="accounting-panel-sub">Fast SQL aggregation keeps this chart snappy at scale.</p>
                  </div>
                </div>
                {cashflowTrend.length === 0 ? (
                  <p className="accounting-muted">No orders in this window.</p>
                ) : (
                  <div className="accounting-trend">
                    {cashflowSpark.points && (
                      <div className="accounting-spark">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            points={`0,100 ${cashflowSpark.points} 100,100`}
                            className="accounting-spark-fill"
                          />
                          <polyline
                            points={cashflowSpark.points}
                            className="accounting-spark-line"
                            fill="none"
                          />
                        </svg>
                      </div>
                    )}
                    {cashflowTrend.map((entry) => (
                      <div key={entry.date} className="accounting-trend-row">
                        <span>{new Date(entry.date).toLocaleDateString("en-GB", { month: "short", day: "2-digit" })}</span>
                        <div className="accounting-trend-bar">
                          <span
                            style={{
                              width: `${Math.min(100, Math.max(8, (entry.revenue / (data.revenue || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="accounting-trend-value">{formatCurrency(entry.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {!loading && !error && data && viewMode === "charts" && (
          <>
            <section className="accounting-kpis">
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Gross revenue</p>
                <h3 className="accounting-kpi-value">{formatCurrency(data.revenue || 0)}</h3>
                <p className="accounting-kpi-sub">{data.windowLabel || ""}</p>
              </div>
              <div className="accounting-kpi-card">
                <p className="accounting-kpi-label">Retail vs Rentals</p>
                <h3 className="accounting-kpi-value">
                  {revenueSplit.retailPct}% / {revenueSplit.rentalPct}%
                </h3>
                <p className="accounting-kpi-sub">Income diversification</p>
              </div>
            </section>

            <section className="accounting-panels charts-only">
              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Revenue mix</p>
                    <h3>Retail vs. Rentals</h3>
                    <p className="accounting-panel-sub">Spot imbalances and run promotions where needed.</p>
                  </div>
                </div>
                <div className="accounting-split-bar">
                  <span
                    className="accounting-split retail"
                    style={{ width: `${Math.max(revenueSplit.retailPct, 1)}%` }}
                    title={`Retail ${formatCurrency(revenueSplit.retail)}`}
                  />
                  <span
                    className="accounting-split rental"
                    style={{ width: `${Math.max(revenueSplit.rentalPct, 1)}%` }}
                    title={`Rentals ${formatCurrency(revenueSplit.rental)}`}
                  />
                  {revenueSplit.otherPct > 0 && (
                    <span
                      className="accounting-split other"
                      style={{ width: `${Math.max(revenueSplit.otherPct, 1)}%` }}
                      title={`Other ${formatCurrency(revenueSplit.other)}`}
                    />
                  )}
                </div>
                <div className="accounting-split-legend">
                  <div>
                    <span className="dot retail" /> Retail {formatCurrency(revenueSplit.retail)}
                  </div>
                  <div>
                    <span className="dot rental" /> Rentals {formatCurrency(revenueSplit.rental)}
                  </div>
                  {revenueSplit.other > 0 && (
                    <div>
                      <span className="dot other" /> Other {formatCurrency(revenueSplit.other)}
                    </div>
                  )}
                </div>
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Cash flow</p>
                    <h3>Sparkline</h3>
                    <p className="accounting-panel-sub">Daily revenue trend for {data.windowLabel || ""}.</p>
                  </div>
                </div>
                {cashflowSpark.points ? (
                  <div className="accounting-spark large">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline
                        points={`0,100 ${cashflowSpark.points} 100,100`}
                        className="accounting-spark-fill"
                      />
                      <polyline
                        points={cashflowSpark.points}
                        className="accounting-spark-line"
                        fill="none"
                      />
                    </svg>
                  </div>
                ) : (
                  <p className="accounting-muted">No cash flow data this window.</p>
                )}
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Top products</p>
                    <h3>Revenue bars</h3>
                    <p className="accounting-panel-sub">See leaders at a glance.</p>
                  </div>
                </div>
                {topProducts.length === 0 ? (
                  <p className="accounting-muted">No products sold in this window.</p>
                ) : (
                  <ul className="accounting-list">
                    {topProducts.map((product) => (
                      <li key={product.id}>
                        <div>
                          <strong>{product.name || "Untitled"}</strong>
                          <p className="accounting-muted">{product.sku ? `SKU ${product.sku}` : "No SKU"}</p>
                        </div>
                        <div className="accounting-list-meta">
                          <span>{formatCurrency(product.revenue)}</span>
                          <div className="accounting-list-bar">
                            <span
                              style={{
                                width: `${Math.max(
                                  6,
                                  (product.revenue / Math.max(totalRevenue, topProductsMax || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="accounting-panel">
                <div className="accounting-panel-head">
                  <div>
                    <p className="accounting-panel-label">Top rentals</p>
                    <h3>Booked revenue</h3>
                    <p className="accounting-panel-sub">Confirmed bookings this window.</p>
                  </div>
                </div>
                {topRentals.length === 0 ? (
                  <p className="accounting-muted">No rentals booked in this window.</p>
                ) : (
                  <ul className="accounting-list">
                    {topRentals.map((rental) => (
                      <li key={rental.id}>
                        <div>
                          <strong>{rental.name || "Untitled"}</strong>
                          <p className="accounting-muted">{rental.sku ? `SKU ${rental.sku}` : "No SKU"}</p>
                        </div>
                        <div className="accounting-list-meta">
                          <span>{formatCurrency(rental.revenue)}</span>
                          <div className="accounting-list-bar">
                            <span
                              style={{
                                width: `${Math.max(
                                  6,
                                  (rental.revenue / Math.max(data.bookingRevenue || 0, topRentalsMax || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}

        {!loading && !error && data && viewMode === "kanban" && (
          <section className="accounting-kanban">
            <div className="accounting-kanban-column">
              <h4>Revenue</h4>
              <div className="accounting-kanban-card">
                <p className="accounting-muted">{data.windowLabel || ""}</p>
                <h3>{formatCurrency(data.revenue || 0)}</h3>
                <p className="accounting-panel-sub">Orders {data.orders || 0}</p>
              </div>
              <div className="accounting-kanban-card">
                <p className="accounting-muted">Retail</p>
                <h3>{formatCurrency(revenueSplit.retail)}</h3>
              </div>
              <div className="accounting-kanban-card">
                <p className="accounting-muted">Rentals</p>
                <h3>{formatCurrency(revenueSplit.rental)}</h3>
              </div>
            </div>
            <div className="accounting-kanban-column">
              <h4>Top products</h4>
              {topProducts.length === 0 ? (
                <p className="accounting-muted">No products sold.</p>
              ) : (
                topProducts.map((product) => (
                  <div key={product.id} className="accounting-kanban-card">
                    <strong>{product.name || "Untitled"}</strong>
                    <p className="accounting-muted">{product.sku ? `SKU ${product.sku}` : "No SKU"}</p>
                    <div className="accounting-list-bar">
                      <span
                        style={{
                          width: `${Math.max(
                            6,
                            (product.revenue / Math.max(totalRevenue, topProductsMax || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="accounting-panel-sub">
                      {formatCurrency(product.revenue)} · {product.units} units
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="accounting-kanban-column">
              <h4>Cash flow</h4>
              {cashflowTrend.length === 0 ? (
                <p className="accounting-muted">No orders in this window.</p>
              ) : (
                <div className="accounting-kanban-card">
                  {cashflowSpark.points && (
                    <div className="accounting-spark small">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          points={`0,100 ${cashflowSpark.points} 100,100`}
                          className="accounting-spark-fill"
                        />
                        <polyline
                          points={cashflowSpark.points}
                          className="accounting-spark-line"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                  <ul className="accounting-list compact">
                    {cashflowTrend.slice(-6).map((entry) => (
                      <li key={entry.date}>
                        <div>
                          <strong>{new Date(entry.date).toLocaleDateString("en-GB", { month: "short", day: "2-digit" })}</strong>
                        </div>
                        <div className="accounting-list-meta">
                          <span>{formatCurrency(entry.revenue)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="accounting-kanban-column">
              <h4>Top rentals</h4>
              {topRentals.length === 0 ? (
                <p className="accounting-muted">No rentals booked.</p>
              ) : (
                topRentals.map((rental) => (
                  <div key={rental.id} className="accounting-kanban-card">
                    <strong>{rental.name || "Untitled"}</strong>
                    <p className="accounting-muted">{rental.sku ? `SKU ${rental.sku}` : "No SKU"}</p>
                    <div className="accounting-list-bar">
                      <span
                        style={{
                          width: `${Math.max(
                            6,
                            (rental.revenue / Math.max(data.bookingRevenue || 0, topRentalsMax || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="accounting-panel-sub">
                      {formatCurrency(rental.revenue)} · {rental.units} units
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!loading && !error && data && viewMode === "list" && (
          <section className="accounting-table accounting-list-table">
            <div className="accounting-table-title">
              <h3>Receipts & invoices</h3>
              <span>{data.windowLabel || ""}</span>
            </div>
            {listError && <p className="accounting-error">{listError}</p>}
            {listLoading ? (
              <p className="accounting-status">Loading receipts and invoices…</p>
            ) : (
              <div className="admin-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Number</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="accounting-empty">
                          No receipts or invoices in this window.
                        </td>
                      </tr>
                    )}
                    {listRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.type}</td>
                        <td>{row.number}</td>
                        <td>{row.customer}</td>
                        <td>{formatDate(row.date)}</td>
                        <td>{row.status}</td>
                        <td>{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5}>Receipts total</td>
                      <td>{formatCurrency(receiptsTotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5}>Invoices total</td>
                      <td>{formatCurrency(invoicesTotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5}>Combined total</td>
                      <td>{formatCurrency(combinedTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        )}

        {!loading && !error && data && viewMode === "taxes" && (
          <section className="accounting-panels accounting-panels-stack">
            <div className="accounting-panel">
              <div className="accounting-panel-head">
                <h3>Tax summary</h3>
                <span className="accounting-panel-label">{data.windowLabel || ""}</span>
              </div>
              <div className="accounting-pnl">
                <div className="accounting-pnl-row">
                  <span>Tax rate</span>
                  <strong>{taxRate > 0 ? taxLabel : "Not set"}</strong>
                </div>
                <div className="accounting-pnl-row">
                  <span>Receipts (retail)</span>
                  <strong>{formatCurrency(receiptsTotal)}</strong>
                </div>
                <div className="accounting-pnl-row">
                  <span>Invoices (rentals)</span>
                  <strong>{formatCurrency(invoicesTotal)}</strong>
                </div>
                <div className="accounting-pnl-row total">
                  <span>Estimated tax due</span>
                  <strong>{formatCurrency(taxDue)}</strong>
                </div>
              </div>
              {taxRate === 0 && (
                <p className="accounting-muted">Set your tax rate in Settings → ERP Config.</p>
              )}
            </div>
            <div className="accounting-panel">
              <div className="accounting-panel-head">
                <h3>Tax breakdown</h3>
                <span className="accounting-panel-label">By document type</span>
              </div>
              <div className="accounting-table">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Taxable total</th>
                      <th>Tax ({taxLabel})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Receipts</td>
                      <td>{formatCurrency(receiptsTotal)}</td>
                      <td>{formatCurrency(receiptsTotal * taxRate)}</td>
                    </tr>
                    <tr>
                      <td>Invoices</td>
                      <td>{formatCurrency(invoicesTotal)}</td>
                      <td>{formatCurrency(invoicesTotal * taxRate)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td>{formatCurrency(combinedTotal)}</td>
                      <td>{formatCurrency(taxDue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminAccounting;
