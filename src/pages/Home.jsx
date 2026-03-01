import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '/src/styles/Home.css';
import { AppIcon } from '/src/components/Icon';
import {
  faBolt,
  faHeart,
  faRocket,
  faShieldHeart,
} from '/src/icons/iconSet';
import PopupModal from '../components/PopupModal';
import CookieBanner from '../components/CookieBanner';
import { fetchInventoryWithCache, splitInventory } from '../utils/inventoryCache';
import { DEFAULT_TEMPLATE_CONFIG, useTemplateConfig } from '../context/TemplateConfigContext';

const HERO_PROOF_ITEMS = [
  'Bouncy Castles',
  'Cotton Candy',
  'Popcorn',
  'Trampoline',
  'Face Painting',
  'Party Supplies'
];

const HERO_STATS = [
  {
    key: 'inventory',
    label: 'Inventory Items',
    meta: 'cleaned and event-ready'
  },
  {
    key: 'rentals',
    label: 'Rentals',
    meta: 'bookable party options'
  },
  {
    key: 'years',
    label: 'Serving Ghana',
    meta: 'trusted celebrations delivered'
  }
];

const formatHeroStatValue = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '...';
  if (value >= 1000) {
    const compact = value >= 10000
      ? Math.round(value / 1000)
      : Math.round((value / 1000) * 10) / 10;
    return `${String(compact).replace(/\.0$/, '')}k+`;
  }
  return `${value}+`;
};

const WHY_REEBS_ITEMS = [
  {
    icon: faRocket,
    title: 'We show up early',
    copy: 'Setup starts before guests arrive, so your event starts on time and calm.'
  },
  {
    icon: faBolt,
    title: 'No last-minute stress',
    copy: 'We confirm details ahead of time and stay reachable when you need us.'
  },
  {
    icon: faHeart,
    title: 'Packages that fit your budget',
    copy: 'From simple setups to full styling, we help you choose what you actually need.'
  },
  {
    icon: faShieldHeart,
    title: 'Kid-friendly and safe',
    copy: 'Clean equipment, secure setup, and a team that knows how to run family events.'
  }
];

const PROCESS_STEPS = [
  {
    title: 'Tell us the plan',
    copy: 'Share your date, guest count, and vibe. We reply fast with a clear game plan.'
  },
  {
    title: 'Pick your setup',
    copy: 'Choose your rentals, decor, and extras. We bundle everything so it is easy to approve.'
  },
  {
    title: 'We deliver and style',
    copy: 'Our team arrives, sets up, tests each item, and styles the space so you can breathe.'
  },
  {
    title: 'You enjoy, we wrap',
    copy: 'After the party, we handle pickup and reset quickly. No post-party headache for you.'
  }
];

const HOME_SERVICES = [
  {
    title: 'Party Rentals',
    copy: 'Bouncy castles, tents, tables, chairs, games, and crowd favorites for every party size.',
    to: '/Rentals',
    image: '/imgs/bouncer.png',
    alt: 'Party equipment rentals',
    linkLabel: 'See rentals'
  },
  {
    title: 'Full Party Styling',
    copy: 'From balloons to backdrops, we style the space so it looks great in real life and in photos.',
    to: '/Contact',
    image: '/imgs/decor.png',
    alt: 'Full party styling service',
    linkLabel: 'Plan with us'
  },
  {
    title: 'Party Supply Shop',
    copy: 'Need quick add-ons? Grab decor, balloons, favors, and essentials in one stop.',
    to: '/Shop',
    image: '/imgs/supplies.png',
    alt: 'Party supplies shop',
    linkLabel: 'Shop now'
  }
];

const HOME_RENTAL_BG_MAP = {
  "bouncy castles": "/imgs/rentalbg/img_1.png",
  "kids rentals": "/imgs/rentalbg/img_2.png",
  "indoor games": "/imgs/rentalbg/img_3.png",
  "setup": "/imgs/rentalbg/img_4.png",
};

const getHomeRentalCategory = (rental = {}) => {
  const category = `${rental.specificCategory || rental.specificcategory || rental.category || ""}`.toLowerCase();
  const name = `${rental.name || ""}`.toLowerCase();

  if (category.includes("bouncy")) return "bouncy castles";
  if (category.includes("indoor") || category.includes("board game") || category.includes("jenga")) {
    return "indoor games";
  }
  if (category.includes("machine") || category.includes("setup")) return "setup";
  if (category.includes("kids") || category.includes("kid") || category.includes("rental")) {
    return "kids rentals";
  }
  if (name.includes("popcorn") || name.includes("snow cone") || name.includes("snowcone") || name.includes("cotton candy")) {
    return "kids rentals";
  }

  return "";
};

const getHomeRentalBackground = (rental = {}) => {
  const categoryKey = getHomeRentalCategory(rental);
  return HOME_RENTAL_BG_MAP[categoryKey] || rental.image || rental.imageUrl || "/imgs/placeholder.png";
};

const getHomeRentalImage = (rental = {}) => rental.image || rental.imageUrl || "/imgs/placeholder.png";

const asHomeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getHomeRentalPopularityScore = (rental = {}) => {
  const name = `${rental.name || ""}`.toLowerCase();
  const category = getHomeRentalCategory(rental);
  const quantity = Math.max(0, asHomeNumber(rental.quantity ?? rental.stock, 0));
  const image = getHomeRentalImage(rental);
  let score = 0;

  if (name.includes("bouncy") || name.includes("castle")) score += 100;
  if (name.includes("trampoline")) score += 86;
  if (name.includes("popcorn")) score += 84;
  if (name.includes("cotton candy")) score += 82;
  if (name.includes("snow cone") || name.includes("snowcone")) score += 78;
  if (name.includes("face paint") || name.includes("face painting")) score += 66;

  if (category === "kids rentals") score += 42;
  if (category === "bouncy castles") score += 32;
  if (category === "setup") score += 22;
  if (category === "indoor games") score += 16;

  score += Math.min(quantity, 40);
  if (image.includes("placeholder")) score -= 40;
  if ((rental.status ?? rental.isActive) === false) score -= 1000;

  return score;
};
const REAL_PARTY_MOMENTS = [
  {
    quote: 'REEBS handled setup and pickup so smoothly. We actually enjoyed the party instead of stressing.',
    name: 'Ama, East Legon',
    event: 'Birthday setup'
  },
  {
    quote: 'The kids stayed busy all day and the team arrived early. Everything felt organized and fun.',
    name: 'Kwame, Tema Community 25',
    event: 'Kids party'
  },
  {
    quote: 'Fast response, clear pricing, no surprises. Exactly what we needed for our office fun day.',
    name: 'Nana, Airport Residential',
    event: 'Corporate fun day'
  }
];

const POPULAR_PACKAGES = [
  {
    title: 'Kids Party',
    copy: 'Bouncy castle, games, and treats for high-energy birthdays.',
    to: '/book'
  },
  {
    title: 'Corporate Fun Day',
    copy: 'Team-friendly setups with activities, canopies, and event support.',
    to: '/contact'
  },
  {
    title: 'Birthday Setup',
    copy: 'Decor styling, seating, and themed add-ons ready before guests arrive.',
    to: '/book'
  }
];

const QUICK_ANSWERS = [
  {
    question: 'How long does setup take?',
    answer: 'Most setups take 45 to 120 minutes depending on package size.'
  },
  {
    question: 'Which areas do you deliver to?',
    answer: 'We deliver across Accra, Tema, and nearby areas. Ask us for your exact location.'
  },
  {
    question: 'What payment options are available?',
    answer: 'Mobile money, bank transfer, and card options are available based on your booking.'
  }
];

const SERVICE_START_YEAR = 2004;

function Home() {
  const navigate = useNavigate();
  const heroVideoRef = useRef(null);
  const [suggestedRentals, setSuggestedRentals] = useState([]);
  const [activeFeaturedRentalIndex, setActiveFeaturedRentalIndex] = useState(0);
  const [heroStats, setHeroStats] = useState({
    inventory: null,
    rentals: null,
  });
  const [heroEmail, setHeroEmail] = useState('');
  const { config } = useTemplateConfig();
  const templateSettings = { ...DEFAULT_TEMPLATE_CONFIG, ...config };
  const yearsServing = Math.max(0, new Date().getFullYear() - SERVICE_START_YEAR);
  const yearsServingBadge = Math.floor(yearsServing / 5) * 5;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        const { items } = await fetchInventoryWithCache({ signal: controller.signal });
        if (!isMounted) return;

        const safeItems = Array.isArray(items) ? items : [];
        const { rentals } = splitInventory(safeItems);
        const activeRentals = rentals.filter((item) => (item.status ?? item.isActive) !== false);
        const topRentals = [...activeRentals]
          .sort((a, b) => {
            const scoreDiff = getHomeRentalPopularityScore(b) - getHomeRentalPopularityScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            return `${a.name || ""}`.localeCompare(`${b.name || ""}`);
          })
          .slice(0, 4);

        setSuggestedRentals(topRentals);
        setHeroStats({
          inventory: safeItems.length,
          rentals: activeRentals.length,
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Error loading data:", err);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!suggestedRentals.length) {
      setActiveFeaturedRentalIndex(0);
      return;
    }

    setActiveFeaturedRentalIndex((prev) => Math.min(prev, suggestedRentals.length - 1));
  }, [suggestedRentals.length]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return undefined;

    const safePlay = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    const restartLoop = () => {
      video.currentTime = 0;
      safePlay();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) safePlay();
    };

    const rafId = window.requestAnimationFrame(safePlay);
    safePlay();

    video.addEventListener('canplay', safePlay);
    video.addEventListener('loadedmetadata', safePlay);
    video.addEventListener('ended', restartLoop);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      video.removeEventListener('canplay', safePlay);
      video.removeEventListener('loadedmetadata', safePlay);
      video.removeEventListener('ended', restartLoop);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleHeroLeadSubmit = (e) => {
    e.preventDefault();
    navigate('/Contact', { state: { leadEmail: heroEmail.trim() } });
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <CookieBanner />
      <PopupModal />
      
      <main className="home" id="main" role="main">
        {/* HERO SECTION */}
        <section id="hero-section" className="home-hero">
          <div className="hero-video-container" aria-hidden="true">
            <video
              ref={heroVideoRef}
              className="hero-video"
              autoPlay
              loop
              muted
              defaultMuted
              playsInline
              preload="auto"
              disablePictureInPicture
            >
              <source src="/imgs/moving/background18.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content">

            <h1 className="hero-title">
              {templateSettings.heroHeading}
            </h1>

            <p className="hero-subtitle">
              {templateSettings.heroTagline}
            </p>

            <form className="hero-lead-form" onSubmit={handleHeroLeadSubmit}>
              <input
                type="email"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                required
              />
              <button type="submit" className="hero-lead-submit">
                <span>Sign up to our Newsletter</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="hero-proof-row" aria-label="Services and Products we have">
              {HERO_PROOF_ITEMS.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="why-stats-shell" role="region" aria-label="REEBS highlights">
              <div className="why-stats" role="list" aria-label="REEBS highlights">
                {HERO_STATS.map((stat) => (
                  <p className="why-stat" role="listitem" key={stat.key}>
                    <span className="why-stat-value">
                      {stat.key === 'years'
                        ? `${yearsServingBadge}+ years`
                        : formatHeroStatValue(heroStats[stat.key])}
                    </span>
                    <span className="why-stat-label">{stat.label}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHY REEBS */}
        <section className="home-flow home-flow--why">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Why Call REEBS</h2>
              <p className="section-description">
                One team for rentals, styling, and support, so your day feels fun instead of stressful.
              </p>
            </div>

            <ul className="why-list" role="list">
              {WHY_REEBS_ITEMS.map((item) => (
                <li className="why-item" key={item.title}>
                  <span className="why-icon"><AppIcon icon={item.icon} /></span>
                  <div className="why-copy">
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="home-flow home-flow--process">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">How It Works</span>
              <h2 className="section-title">Simple Steps, Zero Stress</h2>
              <p className="section-description">From first chat to final pickup, we keep it clear and easy.</p>
            </div>

            <ol className="process-line">
              {PROCESS_STEPS.map((step, index) => (
                <li key={step.title} className="process-step">
                  <span className="process-index">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SERVICES */}
        <section className="home-flow home-flow--services">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Everything You Need, In One Place</h2>
              <p className="section-description">Rentals, styling, and party supplies without running around town.</p>
            </div>

            <div className="services-rail">
              {HOME_SERVICES.map((service) => (
                <article className="service-row" key={service.title}>
                  <img
                    src={service.image}
                    alt={service.alt}
                    className="service-media"
                    loading="lazy"
                  />
                  <div className="service-copy">
                    <h3>{service.title}</h3>
                    <p>{service.copy}</p>
                    <Link to={service.to} className="service-inline-link">
                      {service.linkLabel} →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED RENTALS */}
        {suggestedRentals.length > 0 && (
          <section className="home-flow home-flow--featured">
            <div className="container">
              <div className="section-header">
                <span className="section-kicker">Most Booked</span>
                <h2 className="section-title">What People Are Booking Right Now</h2>
                <p className="section-description">A quick peek at crowd favorites this month.</p>
              </div>

              <div className="featured-rental-panels" role="list" aria-label="Most booked rentals">
                {suggestedRentals.map((rental, index) => {
                  const isActive = index === activeFeaturedRentalIndex;
                  const rentalCategory =
                    rental.specificCategory ||
                    rental.specificcategory ||
                    rental.category ||
                    "Popular rental";

                  return (
                    <Link
                      key={rental.productId || rental.id || rental.slug || `${rental.name}-${index}`}
                      to={`/Rentals/${rental.slug || rental.id || rental.productId}`}
                      className={`featured-rental-panel ${isActive ? "is-active" : ""}`}
                      role="listitem"
                      onMouseEnter={() => setActiveFeaturedRentalIndex(index)}
                      onFocus={() => setActiveFeaturedRentalIndex(index)}
                      onTouchStart={() => setActiveFeaturedRentalIndex(index)}
                      onClick={() => setActiveFeaturedRentalIndex(index)}
                      aria-label={`${rental.name}. ${rentalCategory}. View rental details.`}
                    >
                      <div
                        className="featured-rental-media-shell"
                        style={{ "--rent-category-bg": `url("${getHomeRentalBackground(rental)}")` }}
                      >
                        <img
                          src={getHomeRentalImage(rental)}
                          alt={rental.name}
                          className="featured-rental-media"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <span className="featured-rental-overlay" aria-hidden="true" />
                      <div className="featured-rental-copy">
                        <p>{rentalCategory}</p>
                        <h3>{rental.name}</h3>
                        <span className="featured-rental-cta">View rental →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="featured-more">
                <Link to="/Rentals" className="btn btn-primary btn-lg">Browse All Rentals</Link>
              </div>
            </div>
          </section>
        )}

        {/* REAL MOMENTS */}
        <section className="home-flow home-flow--moments">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">Real Party Moments</span>
              <h2 className="section-title">What Clients Say After The Event</h2>
              <p className="section-description">
                Quick notes from families and teams who have booked with REEBS.
              </p>
            </div>

            <ul className="moments-list" role="list">
              {REAL_PARTY_MOMENTS.map((moment) => (
                <li key={`${moment.name}-${moment.event}`} className="moment-row">
                  <p className="moment-quote">“{moment.quote}”</p>
                  <p className="moment-meta">{moment.name} · {moment.event}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* POPULAR PACKAGES */}
        <section className="home-flow home-flow--packages">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">Popular Packages</span>
              <h2 className="section-title">Pick A Setup And We Handle The Rest</h2>
            </div>

            <div className="packages-strip" role="list" aria-label="Popular REEBS packages">
              {POPULAR_PACKAGES.map((pkg) => (
                <article key={pkg.title} className="package-lane" role="listitem">
                  <h3>{pkg.title}</h3>
                  <p>{pkg.copy}</p>
                  <Link to={pkg.to} className="package-link">Get this package →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* QUICK ANSWERS */}
        <section className="home-flow home-flow--answers">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">Quick Answers</span>
              <h2 className="section-title">Before You Book</h2>
            </div>

            <div className="answers-grid">
              {QUICK_ANSWERS.map((item) => (
                <article key={item.question} className="answer-row">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
