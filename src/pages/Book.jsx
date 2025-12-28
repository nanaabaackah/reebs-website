import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faClipboardList,
  faClock,
  faMagnifyingGlass,
  faShieldHeart,
  faTruckFast,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../components/CartContext";
import bouncyCastleTypes from "/src/data/bouncyCastleTypes.json";

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const rentalSlug = (item) => {
  const pageSlug = item?.page?.split("/").filter(Boolean).pop();
  const nameSlug = slugify(item?.name);
  return pageSlug || nameSlug || item?.id || "";
};

const isBouncyRental = (item) => {
  if (!item) return false;
  const name = item.name?.toLowerCase() || "";
  const page = item.page?.toLowerCase() || "";
  return name.includes("bouncy") || page.includes("bouncy");
};

const getItemPrice = (item) => {
  if (item?.price !== undefined && item.price !== null && item.price !== "") return item.price;
  if (typeof item?.priceCents === "number") return item.priceCents / 100;
  return undefined;
};

const formatRentalPrice = (item, convertPrice, formatCurrency) => {
  if (item?.id === 8) return "Contact for more info.";
  const priceValue = getItemPrice(item);
  if (priceValue === undefined || priceValue === null || priceValue === 0 || priceValue === "0") {
    return "Contact for price";
  }

  if (typeof priceValue === "string" && priceValue.includes("-")) {
    const [min, max] = priceValue.split("-").map((part) => Number(part.trim()));
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return `${formatCurrency(convertPrice(min))} - ${formatCurrency(
        convertPrice(max)
      )} ${item.rate || ""}`.trim();
    }
  }

  const numericPrice = Number(priceValue);
  if (Number.isNaN(numericPrice)) return "Contact for price";
  return `${formatCurrency(convertPrice(numericPrice))} ${item.rate || ""}`.trim();
};

const formatStatus = (status, isActive) => {
  if (typeof status === "boolean") return status ? "Available" : "Unavailable";
  if (typeof isActive === "boolean") return isActive ? "Available" : "Unavailable";
  if (!status) return "Available";
  const lower = status.toString().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

function Book() {
  const { convertPrice, formatCurrency } = useCart();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [itemsNote, setItemsNote] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);
  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/.netlify/functions/inventory")
      .then((res) => res.json())
      .then((data) => {
        const rentalsOnly = (Array.isArray(data) ? data : []).filter((item) => {
          const source = (item.sourceCategoryCode || item.sourcecategorycode || "").toString().toLowerCase();
          const isRental = source ? source === "rental" : (item.sku || "").toString().toUpperCase().startsWith("REN");
          const isActive = (item.status ?? item.isActive) !== false;
          return isRental && isActive;
        });
        setRentals(rentalsOnly);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching rental:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    document.body.classList.add("rentals-theme");
    return () => document.body.classList.remove("rentals-theme");
  }, []);

  const bookingRentals = useMemo(() => {
    if (!rentals.length) return [];
    const baseBouncy = rentals.find((item) => isBouncyRental(item));
    if (!baseBouncy) return rentals;

    const bouncyOptions = bouncyCastleTypes.map((type) => ({
      id: `bouncy-${slugify(type.name)}`,
      name: type.name,
      image: type.image,
      imageUrl: type.image,
      rate: baseBouncy.rate,
      status: baseBouncy.status,
      isActive: baseBouncy.isActive,
      displayPrice: type.priceRange,
      specificCategory: baseBouncy.specificCategory || baseBouncy.specificcategory || baseBouncy.category || "Bouncy Castle",
      detailSlug: rentalSlug(baseBouncy),
      type: "bouncy",
    }));

    const filtered = rentals.filter((item) => !isBouncyRental(item));
    return [...bouncyOptions, ...filtered];
  }, [rentals]);

  useEffect(() => {
    if (!bookingRentals.length) return;
    const rentalSlugParam = searchParams.get("rental");
    if (!rentalSlugParam) return;

    const normalized = rentalSlugParam.toLowerCase();
    const bouncyParam = searchParams.get("bouncy");
    let match = null;

    if (bouncyParam) {
      const bouncyId = `bouncy-${bouncyParam.toLowerCase()}`;
      match = bookingRentals.find((item) => item.id === bouncyId);
    } else {
      match = bookingRentals.find((item) => {
        const slug = (item.detailSlug || rentalSlug(item)).toLowerCase();
        return slug === normalized;
      });
      if (match?.type === "bouncy") {
        match = null;
      }
    }

    if (match) {
      setSelectedIds((prev) => (prev.includes(match.id) ? prev : [...prev, match.id]));
    }
  }, [bookingRentals, searchParams]);

  const filteredRentals = useMemo(() => {
    if (!searchQuery) return bookingRentals;
    const q = searchQuery.toLowerCase();
    return bookingRentals.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.specificCategory?.toLowerCase().includes(q) ||
        item.specificcategory?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    });
  }, [bookingRentals, searchQuery]);

  const selectedRentals = useMemo(
    () => bookingRentals.filter((item) => selectedIds.includes(item.id)),
    [bookingRentals, selectedIds]
  );

  useEffect(() => {
    if (!noteTouched) {
      setItemsNote(selectedRentals.map((item) => item.name).join(", "));
    }
  }, [selectedRentals, noteTouched]);

  const toggleRental = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const itemsSummaryValue = selectedRentals
    .map((item) => `${item.name} (${item.specificCategory || item.specificcategory || item.category || "Rental"})`)
    .join(", ");
  const itemsSummaryDisplay = itemsSummaryValue || "Add rentals to your booking";

  if (loading) {
    return (
      <div className="loader">
        <img src="/imgs/reebs.gif" alt="Loading rental booking" className="loader-gif" />
      </div>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="booking-page rentals-theme" id="main">
        <main className="booking-shell">
          <section className="booking-hero glass-card" aria-labelledby="booking-hero-heading">
            <div className="booking-hero-copy">
              <p className="kicker">Rental booking</p>
              <h1 id="booking-hero-heading">Reserve your rentals</h1>
              <p className="booking-hero-sub">
                Pick the bounce house, decor, or concessions you want. We confirm availability, delivery,
                and setup details for your date.
              </p>
              <div className="booking-pills" aria-label="Booking highlights">
                <span>
                  <FontAwesomeIcon icon={faWandMagicSparkles} /> Rentals only
                </span>
                <span>
                  <FontAwesomeIcon icon={faTruckFast} /> Delivery & pickup handled
                </span>
                <span>
                  <FontAwesomeIcon icon={faShieldHeart} /> Sanitized + kid-safe
                </span>
              </div>
              <div className="booking-cta-row" role="group" aria-label="Booking actions">
                <a className="hero-btn hero-btn-primary" href="#booking-form">
                  Start booking
                </a>
                <Link className="hero-btn hero-btn-ghost" to="/Rentals">
                  Browse rentals
                </Link>
              </div>
              <div className="booking-meta">
                <div>
                  <FontAwesomeIcon icon={faCalendarCheck} />
                  <div>
                    <strong>Same-day replies</strong>
                    <p>We hold your date while we confirm delivery & setup.</p>
                  </div>
                </div>
                <div>
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <strong>Flexible timing</strong>
                    <p>Morning drop-offs and evening pickups available.</p>
                  </div>
                </div>
                <div>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <div>
                    <strong>Clear checklist</strong>
                    <p>We’ll share a prep list once your booking is locked.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="booking-hero-card glass-card">
              <p className="kicker">Why this form</p>
              <h2>Built for rentals</h2>
              <p className="booking-hero-note">
                This booking form is only for rental items (bounce castles, decor, concessions, props).
                For balloons or full styling, use the Contact page instead.
              </p>
              <div className="booking-hero-stats">
                <div>
                  <strong>{rentals.length}</strong>
                  <span>Rental items live</span>
                </div>
                <div>
                  <strong>Accra</strong>
                  <span>Delivery & pickup</span>
                </div>
                <div>
                  <strong>48 hrs</strong>
                  <span>Reschedule window</span>
                </div>
              </div>
            </div>
          </section>

          <section className="booking-grid">
            <article className="booking-form-card glass-card" id="booking-form" aria-labelledby="booking-form-heading">
              <div className="section-header rent-section-header">
                <p className="kicker">Rental booking</p>
                <h2 id="booking-form-heading">Tell us about your event</h2>
                <p className="rental-sub">
                  Add the rentals you want, your date, and where we’re delivering. We confirm availability quickly.
                </p>
              </div>
              <form
                className="contact-form booking-form"
                name="rental-booking"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
              >
                <input type="hidden" name="form-name" value="rental-booking" />
                <p className="hidden">
                  <label>
                    Don’t fill this out: <input name="bot-field" />
                  </label>
                </p>
                <input type="hidden" name="selectedRentals" value={itemsSummaryValue} />

                <p className="contact-form-note">
                  Rentals only. We hold your date and reply with confirmation and the delivery window.
                </p>

                <div className="contact-form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName">Name</label>
                    <input
                      id="fullName"
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone / WhatsApp</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+233 24 423 8419"
                      pattern="^[0-9+\\-()\\s]{7,}$"
                      required
                    />
                    <small className="hint">We’ll confirm on call or WhatsApp.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="eventDate">Event date</label>
                    <input
                      id="eventDate"
                      type="date"
                      name="eventDate"
                      min={today}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="eventWindow">Setup & pickup window</label>
                    <select id="eventWindow" name="eventWindow" defaultValue="">
                      <option value="" disabled>
                        Choose a timing window
                      </option>
                      <option value="Morning setup (7am - 11am)">Morning setup (7am – 11am)</option>
                      <option value="Midday setup (11am - 2pm)">Midday setup (11am – 2pm)</option>
                      <option value="Afternoon setup (2pm - 5pm)">Afternoon setup (2pm – 5pm)</option>
                      <option value="Evening pickup">Evening pickup</option>
                      <option value="Flex / tell us">I’ll share a specific time</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location / venue</label>
                    <input
                      id="location"
                      type="text"
                      name="location"
                      placeholder="Neighborhood or venue in Accra"
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="guestCount">Guest count</label>
                    <input
                      id="guestCount"
                      type="number"
                      name="guestCount"
                      min="1"
                      placeholder="Approx. guests"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contactPreference">How should we confirm?</label>
                    <select id="contactPreference" name="contactPreference" defaultValue="">
                      <option value="" disabled>
                        Choose a contact method
                      </option>
                      <option value="Phone call">Phone call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="rentalNotes">Rental picks & notes</label>
                    <textarea
                      id="rentalNotes"
                      name="rentalNotes"
                      rows="5"
                      placeholder="List the rentals you want and any themes or must-haves."
                      value={itemsNote}
                      onChange={(e) => {
                        setNoteTouched(true);
                        setItemsNote(e.target.value);
                      }}
                      required
                    ></textarea>
                    <small className="hint">Selected rentals: {itemsSummaryDisplay}</small>
                  </div>
                </div>

                <div className="form-footer">
                  <small className="hint">We reply same day for bookings within Accra.</small>
                  <button type="submit" className="btn btn-primary">
                    Request booking
                  </button>
                </div>
              </form>
            </article>

            <aside className="booking-rentals glass-card" aria-label="Add rentals to your booking">
              <div className="section-header rent-section-header">
                <p className="kicker">Add rentals</p>
                <h3>Choose items to include</h3>
                <p className="rental-sub">
                  This form is for rentals only. Search and add items to pre-fill your booking note.
                </p>
              </div>
              <div className="booking-rental-search">
                <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
                <label htmlFor="rentalSearch" className="sr-only">
                  Search rentals
                </label>
                <input
                  id="rentalSearch"
                  type="search"
                  placeholder="Search bounce houses, decor, concessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="booking-selected" aria-live="polite">
                <p className="rent-meta">Selected rentals</p>
                {selectedRentals.length === 0 ? (
                  <p className="booking-empty">No rentals added yet.</p>
                ) : (
                  <div className="booking-selected-chips">
                    {selectedRentals.map((item) => (
                      <span key={item.id} className="booking-chip">
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="booking-rental-list">
                {filteredRentals.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  const detailSlug = item.detailSlug || rentalSlug(item);
                  return (
                    <div
                      key={item.id}
                      className={`booking-rental-card glass-card ${selected ? "is-selected" : ""}`}
                    >
                      <div className="booking-rental-media">
                        <img src={item.image || item.imageUrl || "/imgs/placeholder.png"} alt={item.name} />
                        <span className="rent-tag">{item.specificCategory || item.category}</span>
                      </div>
                      <div className="booking-rental-body">
                        <div className="booking-rental-head">
                          <h4>{item.name}</h4>
                        <p className="price">
                          {item.displayPrice || formatRentalPrice(item, convertPrice, formatCurrency)}
                        </p>
                      </div>
                      <p className="rent-meta">
                        {formatStatus(item.status, item.isActive)} · {item.rate || "Per booking"}
                      </p>
                        <div className="booking-rental-actions">
                          <button
                            type="button"
                            className={`hero-btn hero-btn-link ${selected ? "selected" : ""}`}
                            onClick={() => toggleRental(item.id)}
                            aria-pressed={selected}
                          >
                            {selected ? "Remove" : "Add to booking"}
                          </button>
                          <Link className="hero-btn hero-btn-ghost" to={`/Rentals/${detailSlug}`}>
                            View details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}

export default Book;
