import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faArrowRightLong,
  faClipboardList,
  faClock,
  faShieldHeart,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "/src/components/CartContext";
import bouncyCastleTypes from "/src/data/bouncyCastleTypes.json";

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const rentalPath = (item) => {
  const pageSlug = item?.page?.split("/").filter(Boolean).pop();
  const nameSlug = slugify(item?.name);
  return `/Rentals/${pageSlug || nameSlug || item?.id || ""}`;
};

const formatRentalPrice = (item, convertPrice, formatCurrency) => {
  if (item?.id === 8) return "Contact for more info.";
  const priceValue = item?.price ?? (typeof item?.priceCents === "number" ? item.priceCents / 100 : undefined);
  if (!priceValue || priceValue === "0" || priceValue === 0) {
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

const formatAge = (age) => {
  if (!age) return "All ages";
  return age;
};

const formatRate = (rate) => {
  if (!rate) return "Per booking";
  const lower = rate.toString().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const isBouncyCastleRental = (item) => {
  if (!item) return false;
  const nameSlug = slugify(item.name);
  const pageSlug = slugify(item.page?.split("/").filter(Boolean).pop() || "");
  return nameSlug.includes("bouncy") || pageSlug.includes("bouncy");
};

const BouncyVariantCard = ({ type }) => {
  const images = type.images?.length ? type.images : type.image ? [type.image] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = images.length > 1;
  const currentImage = images[activeIndex] || null;

  const handlePrev = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <article className="bouncy-card glass-card">
      {currentImage && (
        <div className="bouncy-card-media">
          <img src={currentImage} alt={`${type.name} angle ${activeIndex + 1}`} loading="lazy" />
          {hasMultiple && (
            <>
              <button type="button" className="bouncy-nav bouncy-nav-left" onClick={handlePrev} aria-label={`Previous ${type.name} photo`}>
                <FontAwesomeIcon icon={faArrowLeftLong} />
              </button>
              <button type="button" className="bouncy-nav bouncy-nav-right" onClick={handleNext} aria-label={`Next ${type.name} photo`}>
                <FontAwesomeIcon icon={faArrowRightLong} />
              </button>
              <span className="bouncy-counter">{activeIndex + 1} / {images.length}</span>
            </>
          )}
        </div>
      )}
      <div className="bouncy-card-head">
        <div>
          <p className="kicker">Style</p>
          <h3>{type.name}</h3>
        </div>
        <span className="bouncy-price">{type.priceRange}</span>
      </div>
      <dl className="bouncy-specs">
        <div>
          <dt>Footprint</dt>
          <dd>{type.footprint}</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{type.height}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{type.capacity}</dd>
        </div>
        <div>
          <dt>Recommended age</dt>
          <dd>{type.recommendedAge}</dd>
        </div>
      </dl>
      <p className="bouncy-best">{type.bestFor}</p>
      <p className="bouncy-features">{type.features}</p>
    </article>
  );
};

function RentalItem() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { convertPrice, formatCurrency, currency, setCurrency } = useCart();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/.netlify/functions/rentals")
      .then((res) => res.json())
      .then((data) => {
        const rentalsOnly = (Array.isArray(data) ? data : []).filter((item) => {
          const source = (item.sourceCategoryCode || "").toLowerCase();
          const isRental = source ? source === "rental" : true;
          const active = item.isActive === undefined ? true : item.isActive;
          return isRental && active;
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

const rental = useMemo(() => {
  if (!slug) return null;
  const normalized = slug.toLowerCase();
  return (
    rentals.find((item) => {
      const pageSlug = item.page?.split("/").filter(Boolean).pop()?.toLowerCase();
      const nameSlug = slugify(item.name);
      const idSlug = String(item.id || "").toLowerCase();
      return pageSlug === normalized || nameSlug === normalized || idSlug === normalized;
    }) || null
  );
}, [rentals, slug]);

  const similar = useMemo(() => {
    if (!rental) return [];
    const category = rental.specificCategory || rental.category || "";
    if (!category) return [];
    return rentals
      .filter((item) => {
        const itemCategory = item.specificCategory || item.category || "";
        return itemCategory === category && item.id !== rental.id;
      })
      .slice(0, 3);
  }, [rental, rentals]);

  const statusValue =
    typeof rental?.status === "string"
      ? rental.status.toLowerCase()
      : rental?.status === false
        ? "unavailable"
        : rental?.isActive === false
          ? "unavailable"
          : "available";
  const isAvailable = statusValue === "available";
  const showBouncyTable = isBouncyCastleRental(rental);
  const bookingSlug = rentalPath(rental).split("/").filter(Boolean).pop();

  if (loading) {
    return (
      <div className="loader">
        <img src="/imgs/reebs.gif" alt="Loading rental" className="loader-gif" />
      </div>
    );
  }

  if (!rental) {
    return (
      <>
        <main className="rental-detail-shell">
          <div className="rental-detail rentals-page">
            <div className="rental-detail-card glass-card">
              <p className="kicker">Rental not found</p>
              <h1>We couldn’t find that rental.</h1>
              <p>It may have moved or is no longer available. Let’s get you back.</p>
              <div className="rental-actions">
                <button
                  type="button"
                  className="hero-btn hero-btn-primary"
                  onClick={() => navigate("/Rentals")}
                >
                  Back to rentals
                </button>
                <Link className="hero-btn hero-btn-ghost" to="/Contact">
                  Talk to our team
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const detailHighlights = [
    "Freshly cleaned and inspected before every booking",
    "Delivery, setup, and pickup across Accra available",
    "Theme styling options to match your event",
    "On-call support the day of your party",
  ];

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="rental-detail rentals-page" id="main">
        <main className="rental-detail-shell">
          <nav className="rental-breadcrumb">
            <button
              type="button"
              className="breadcrumb-back"
              onClick={() => navigate(-1)}
            >
              <FontAwesomeIcon icon={faArrowLeftLong} /> Back
            </button>
            <Link to="/Rentals">Rentals</Link>
            <FontAwesomeIcon icon={faArrowRightLong} aria-hidden="true" />
            <span>{rental.name}</span>
          </nav>

          <section className="rental-hero-card glass-card">
            <div className="rental-hero-media">
              <img src={rental.imageUrl || rental.image || "/imgs/placeholder.png"} alt={rental.name} />
              <span className="rent-tag">{rental.specificCategory || rental.category}</span>
            </div>
            <div className="rental-hero-copy">
              <p className="kicker">Rental highlight</p>
              <h1>{rental.name}</h1>
              <p className="rental-sub">
                Styled the REEBS way — delivered, set up, and ready for fun.
              </p>

              <div className="rental-price-line">
                <div>
                  <p className="price">{formatRentalPrice(rental, convertPrice, formatCurrency)}</p>
                  <p className="rent-meta">
                    {rental.quantity ? `${rental.quantity} available` : "Availability upon request"}
                  </p>
                </div>
                <div className="rental-currency">
                  <label htmlFor="rentalCurrency" className="sr-only">
                    Select currency
                  </label>
                  <select
                    id="rentalCurrency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="currency-selector"
                  >
                    {["GHS", "USD", "CAD", "GBP", "EUR", "NGN"].map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rental-meta-grid">
                <div>
                  <strong>{rental.specificCategory || rental.category}</strong>
                </div>
                <div>
                  <span className="rent-meta">Rate</span>
                  <strong>{formatRate(rental.rate)}</strong>
                </div>
                <div className={isAvailable ? "status-available" : ""}>
                  <span className="rent-meta">Status</span>
                  <strong>{formatStatus(rental.status, rental.isActive)}</strong>
                </div>
                <div>
                  <span className="rent-meta">Age range</span>
                  <strong>{formatAge(rental.age)}</strong>
                </div>
              </div>

              <div className="rental-actions">
                <Link className="hero-btn hero-btn-primary" to={`/Book?rental=${bookingSlug}`}>
                  Book this rental
                </Link>
                <Link className="hero-btn hero-btn-ghost" to="/Rentals">
                  Browse all rentals
                </Link>
              </div>
            </div>
          </section>

          {showBouncyTable && (
            <section className="rental-detail-card glass-card bouncy-card-section" aria-labelledby="bouncy-table-heading">
              <div className="section-header rent-section-header">
                <p className="kicker">Bouncy castles</p>
                <h2 id="bouncy-table-heading">Choose the right size for your party</h2>
                <p className="rental-sub">
                  Compare footprints, capacity, and pricing so you can match the castle to your guest count and venue space.
                </p>
              </div>
              <div className="bouncy-card-grid">
                {bouncyCastleTypes.map((type) => (
                  <BouncyVariantCard key={type.name} type={type} />
                ))}
              </div>
            </section>
          )}

          <section className="rental-detail-grid">
            <div className="rental-detail-card glass-card">
              <div className="section-header rent-section-header">
                <p className="kicker">What to expect</p>
                <h2>Included with your booking</h2>
              </div>
              <ul className="rental-includes">
                {detailHighlights.map((item) => (
                  <li key={item}>
                    <FontAwesomeIcon icon={faShieldHeart} /> {item}
                  </li>
                ))}
              </ul>
              <div className="rental-feature-row">
                <div>
                  <FontAwesomeIcon icon={faTruckFast} />
                  <div>
                    <strong>Delivery & Pickup</strong>
                    <p>Handled by our team within Accra. We confirm timing after you book.</p>
                  </div>
                </div>
                <div>
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <strong>Timeline</strong>
                    <p>Most setups take under an hour. We’ll align with your venue schedule.</p>
                  </div>
                </div>
                <div>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <div>
                    <strong>Custom notes</strong>
                    <p>Share your theme and guest count so we tailor the setup.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rental-detail-card glass-card">
              <div className="section-header rent-section-header">
                <p className="kicker">Need more?</p>
                <h2>Pair it with these</h2>
              </div>
              {similar.length === 0 && (
                <p className="rent-meta">We’ll suggest add-ons when more rentals are available.</p>
              )}
              <div className="rental-similar-grid">
                {similar.map((item) => (
                  <Link
                    key={item.id}
                    to={rentalPath(item)}
                    className="rental-similar-card glass-card"
                  >
                    <img src={item.imageUrl || item.image || "/imgs/placeholder.png"} alt={item.name} />
                    <div>
                      <span className="rent-meta">{item.specificCategory || item.category}</span>
                      <h3>{item.name}</h3>
                      <p className="price">
                        {formatRentalPrice(item, convertPrice, formatCurrency)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default RentalItem;
