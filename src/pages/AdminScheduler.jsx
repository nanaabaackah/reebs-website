/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./master.css";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeRange = (start, end) => {
  if (!start && !end) return "";
  if (start && end) return `${start} – ${end}`;
  return start || end;
};

const dayKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const buildCalendarDays = (monthDate) => {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);

  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // Monday-start

  const end = new Date(last);
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
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

const geocodeCacheKey = "reebs_booking_geocode_v1";

function AdminScheduler() {
  const [view, setView] = useState("month"); // month | agenda | map
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [locations, setLocations] = useState([]);
  const [mapStats, setMapStats] = useState({ total: 0, geocoded: 0 });
  const [mapFailures, setMapFailures] = useState([]);

  const geocodeQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/.netlify/functions/bookings");
      const text = await response.text();
      const payload = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })();

      if (!response.ok) {
        throw new Error(payload?.error || `Failed to fetch bookings (${response.status}).`);
      }

      setBookings(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      setError(err.message || "We couldn't load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
     
  }, []);

  const bookingsByDay = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) {
      const key = dayKey(booking.eventDate);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(booking);
    }
    for (const [key, list] of map) {
      map.set(
        key,
        [...list].sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")))
      );
    }
    return map;
  }, [bookings]);

  const bookingsByAddress = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) {
      const address = typeof booking.venueAddress === "string" ? booking.venueAddress.trim() : "";
      if (!address) continue;
      if (!map.has(address)) map.set(address, []);
      map.get(address).push(booking);
    }
    return map;
  }, [bookings]);

  const activeDayBookings = useMemo(() => {
    return bookingsByDay.get(dayKey(activeDay)) || [];
  }, [activeDay, bookingsByDay]);

  const monthDays = useMemo(() => buildCalendarDays(monthCursor), [monthCursor]);
  const monthLabel = useMemo(() => {
    return monthCursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, [monthCursor]);

  const mapCenter = useMemo(() => {
    if (locations.length) return [locations[0].lat, locations[0].lng];
    return [5.6037, -0.187]; // Accra fallback
  }, [locations]);

  const loadGeocodeCache = () => {
    try {
      const raw = localStorage.getItem(geocodeCacheKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveGeocodeCache = (cache) => {
    try {
      localStorage.setItem(geocodeCacheKey, JSON.stringify(cache));
    } catch {
      // ignore
    }
  };

  const geocodeAddress = async (address) => {
    const cleaned = String(address || "").trim();
    if (!cleaned) return null;

    const cache = loadGeocodeCache();
    if (cache[cleaned]) {
      return { ok: true, address: cleaned, coords: cache[cleaned], cached: true };
    }

    const response = await fetch("/.netlify/functions/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: cleaned }),
    });
    const raw = await response.text();
    const data = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();
    if (!response.ok) {
      return {
        ok: false,
        address: cleaned,
        reason: data?.error || `HTTP ${response.status}`,
      };
    }
    const lat = Number(data?.lat);
    const lng = Number(data?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const provider = typeof data?.provider === "string" ? data.provider.trim() : "";
      const status = typeof data?.status === "string" ? data.status.trim() : "";
      const label = provider ? provider[0].toUpperCase() + provider.slice(1) : "";
      return {
        ok: false,
        address: cleaned,
        reason: status ? `${label || "Geocode"} ${status}` : data?.lastStatus ? `Nominatim ${data.lastStatus}` : "No match",
        tried: data?.tried,
      };
    }

    const value = { lat, lng, updatedAt: Date.now() };
    cache[cleaned] = value;
    saveGeocodeCache(cache);
    return { ok: true, address: cleaned, coords: value };
  };

  useEffect(() => {
    if (view !== "map") return;

    const uniqueAddresses = Array.from(
      new Set(
        bookings
          .map((booking) => booking.venueAddress)
          .filter((addr) => typeof addr === "string" && addr.trim())
      )
    );

    if (!uniqueAddresses.length) {
      setLocations([]);
      setMapStats({ total: 0, geocoded: 0 });
      setMapFailures([]);
      return;
    }

    let cancelled = false;

    const schedule = (task) => {
      geocodeQueueRef.current = geocodeQueueRef.current
        .then(task)
        .catch(() => {})
        .then(() => new Promise((resolve) => setTimeout(resolve, 350)));
      return geocodeQueueRef.current;
    };

    const run = async () => {
      const results = [];
      const failures = [];
      for (const address of uniqueAddresses.slice(0, 25)) {
        // limit to keep it lightweight
         
        const result = await schedule(() => geocodeAddress(address));
        if (cancelled) return;
        if (result?.ok) {
          results.push({ address, ...result.coords });
        } else {
          failures.push({
            address: result?.address || address,
            reason: result?.reason || "No match",
            tried: result?.tried,
          });
        }
      }

      if (!cancelled) {
        setLocations(results);
        setMapStats({ total: uniqueAddresses.length, geocoded: results.length });
        setMapFailures(failures);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [bookings, view]);

  return (
    <div className="scheduler-page">
      <div className="scheduler-shell">
        <AdminBreadcrumb items={[{ label: "Scheduler" }]} />

        <header className="scheduler-header">
          <div>
            <p className="scheduler-eyebrow">Planning</p>
            <h1>Scheduler</h1>
            <p className="scheduler-subtitle">View bookings by date, agenda, or on a map.</p>
          </div>

          <div className="scheduler-actions">
            <button type="button" className="scheduler-secondary" onClick={fetchBookings}>
              Refresh
            </button>
            <div className="scheduler-seg" role="tablist" aria-label="Scheduler views">
              <button
                type="button"
                role="tab"
                aria-selected={view === "month"}
                className={view === "month" ? "is-active" : ""}
                onClick={() => setView("month")}
              >
                Month
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "agenda"}
                className={view === "agenda" ? "is-active" : ""}
                onClick={() => setView("agenda")}
              >
                Agenda
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "map"}
                className={view === "map" ? "is-active" : ""}
                onClick={() => setView("map")}
              >
                Map
              </button>
            </div>
          </div>
        </header>

        {loading && <p className="scheduler-status">Loading bookings...</p>}
        {!loading && error && <p className="scheduler-error">{error}</p>}

        {!loading && !error && view === "month" && (
          <div className="scheduler-grid">
            <section className="calendar-panel">
              <div className="calendar-header">
                <button
                  type="button"
                  className="calendar-nav"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                >
                  Prev
                </button>
                <h2>{monthLabel}</h2>
                <button
                  type="button"
                  className="calendar-nav"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                >
                  Next
                </button>
              </div>
              <div className="calendar-weekdays">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {monthDays.map((date) => {
                  const key = dayKey(date);
                  const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
                  const isSelected = dayKey(activeDay) === key;
                  const count = bookingsByDay.get(key)?.length || 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      className={
                        "calendar-day" +
                        (isCurrentMonth ? "" : " is-out") +
                        (isSelected ? " is-selected" : "")
                      }
                      onClick={() => setActiveDay(date)}
                    >
                      <span className="calendar-number">{date.getDate()}</span>
                      {count > 0 && <span className="calendar-badge">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="calendar-detail">
              <h3>{formatDate(activeDay)}</h3>
              {activeDayBookings.length === 0 ? (
                <p className="scheduler-muted">No bookings scheduled.</p>
              ) : (
                <div className="agenda-list">
                  {activeDayBookings.map((booking) => (
                    <div key={booking.id} className="agenda-card">
                      <div>
                        <h4>#{booking.id} · {booking.customerName}</h4>
                        <p>
                          {formatTimeRange(booking.startTime, booking.endTime)}
                          {booking.venueAddress ? ` · ${booking.venueAddress}` : ""}
                        </p>
                      </div>
                      <div className="agenda-meta">
                        <span className={`agenda-pill ${booking.status || "pending"}`}>{booking.status}</span>
                        <span className="agenda-amount">
                          {formatMoney((booking.totalAmount || 0) / 100, "GHS")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {!loading && !error && view === "agenda" && (
          <section className="agenda-panel">
            <h2>Upcoming bookings</h2>
            {bookings.length === 0 ? (
              <p className="scheduler-muted">No bookings found.</p>
            ) : (
              <div className="agenda-list">
                {[...bookings]
                  .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
                  .slice(0, 50)
                  .map((booking) => (
                    <div key={booking.id} className="agenda-card">
                      <div>
                        <h4>#{booking.id} · {booking.customerName}</h4>
                        <p>
                          {formatDate(booking.eventDate)}
                          {formatTimeRange(booking.startTime, booking.endTime)
                            ? ` · ${formatTimeRange(booking.startTime, booking.endTime)}`
                            : ""}
                          {booking.venueAddress ? ` · ${booking.venueAddress}` : ""}
                        </p>
                      </div>
                      <div className="agenda-meta">
                        <span className={`agenda-pill ${booking.status || "pending"}`}>{booking.status}</span>
                        <span className="agenda-amount">
                          {formatMoney((booking.totalAmount || 0) / 100, "GHS")}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {!loading && !error && view === "map" && (
          <section className="map-panel">
            <div className="map-header">
              <h2>Delivery map</h2>
              <p className="scheduler-muted">
                Pins are geocoded from venue addresses and cached in your browser. {mapStats.total > 0
                  ? `Geocoded ${mapStats.geocoded}/${mapStats.total} addresses.`
                  : ""}
              </p>
            </div>

            <div className="map-frame">
              <MapContainer center={mapCenter} zoom={11} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((loc) => (
                  <Marker key={loc.address} position={[loc.lat, loc.lng]}>
                    <Popup>
                      <strong>{loc.address}</strong>
                      <div className="map-popup">
                        {(bookingsByAddress.get(loc.address) || []).slice(0, 6).map((booking) => (
                          <div key={booking.id}>
                            #{booking.id} · {booking.customerName} · {formatDate(booking.eventDate)}
                          </div>
                        ))}
                        {(bookingsByAddress.get(loc.address) || []).length > 6 && (
                          <div>…more bookings</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {locations.length === 0 && (
              <p className="scheduler-muted">
                No map pins yet — check venue addresses or try Refresh.
              </p>
            )}

            {mapFailures.length > 0 && (
              <div className="map-failures">
                <p className="scheduler-muted">
                  Addresses not geocoded ({mapFailures.length}):
                </p>
                <ul>
                  {mapFailures.slice(0, 3).map((failure) => (
                    <li key={failure.address}>
                      <strong>{failure.address}</strong> <span>— {failure.reason}</span>
                    </li>
                  ))}
                </ul>
                {mapFailures.length > 3 && (
                  <p className="scheduler-muted">…and more</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminScheduler;
