import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '/src/styles/Home.css';
import { AppIcon } from '/src/components/Icon';
import {
  faBolt,
  faEnvelope,
  faHeart,
  faPhone,
  faRocket,
  faShieldHeart,
  faWhatsapp,
} from '/src/icons/iconSet';
import PopupModal from '../components/PopupModal';
import CookieBanner from '../components/CookieBanner';
import { fetchInventoryWithCache, splitInventory } from '../utils/inventoryCache';
import { DEFAULT_TEMPLATE_CONFIG, useTemplateConfig } from '../context/TemplateConfigContext';

const PROCESS_STEPS = [
  {
    title: 'Dream & Define',
    copy: 'Tell us the vibe, theme, and guest list. We send potential ideas within 24 hours.'
  },
  {
    title: 'Design & Prep',
    copy: 'We lock rentals, decor, and supplies, then prep everything before your date.'
  },
  {
    title: 'Deliver & Style',
    copy: 'Our crew sets up, tests every item, and adds playful touches so the space feels party-ready.'
  },
  {
    title: 'Wrap & Wow',
    copy: 'Pickup is on time, with a quick sweep to leave the venue as tidy as we found it.'
  }
];

function Home() {
  const navigate = useNavigate();
  const [suggestedRentals, setSuggestedRentals] = useState([]);
  const [heroEmail, setHeroEmail] = useState('');
  const { config } = useTemplateConfig();
  const templateSettings = { ...DEFAULT_TEMPLATE_CONFIG, ...config };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        const { items } = await fetchInventoryWithCache({ signal: controller.signal });
        if (!isMounted) return;
        
        const { rentals } = splitInventory(items);
        setSuggestedRentals(rentals.slice(0, 3));
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
              className="hero-video"
              src="/imgs/moving/background18.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          </div>

          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content">

            <h1 className="hero-title">
              {templateSettings.heroHeading || "QA and train your human and AI agents"}
            </h1>

            <p className="hero-subtitle">
              {templateSettings.heroTagline || "Make every customer interaction better, faster, and more consistent with the optimization platform for CX agents."}
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
              <span>Bouncy Castles</span>
              <span>Cotton Candy</span>
              <span>Popcorn</span>
              <span>Trampoline</span>
              <span>Face Painting</span>
              <span>Party Supplies</span>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="home-features">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">Why Choose REEBS</span>
              <h2 className="section-title">Everything You Need for Amazing Parties</h2>
              <p className="section-description">
                Professional service, quality equipment, and attention to detail 
                that makes every celebration special.
              </p>
            </div>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">500+</span>
                <span className="hero-stat-label">Rental Items</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">2k+</span>
                <span className="hero-stat-label">Happy Parties</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">24/7</span>
                <span className="hero-stat-label">Support</span>
              </div>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <AppIcon icon={faRocket} />
                </div>
                <h3 className="feature-title">Fast Setup</h3>
                <p className="feature-description">
                  Our expert team delivers and sets up everything on time, 
                  so you can focus on enjoying your party.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <AppIcon icon={faBolt} />
                </div>
                <h3 className="feature-title">Quality Equipment</h3>
                <p className="feature-description">
                  Premium, well-maintained rentals that are cleaned and 
                  inspected before every event.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <AppIcon icon={faHeart} />
                </div>
                <h3 className="feature-title">Custom Packages</h3>
                <p className="feature-description">
                  Tailored party solutions that match your theme, budget, 
                  and guest count perfectly.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <AppIcon icon={faShieldHeart} />
                </div>
                <h3 className="feature-title">Safety First</h3>
                <p className="feature-description">
                  Kid-safe equipment with proper insurance and trained 
                  staff for peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="home-features">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">Our Process</span>
              <h2 className="section-title">From Idea to Confetti</h2>
              <p className="section-description">
                Four simple steps to bring your party vision to life.
              </p>
            </div>
            
            <div className="features-grid">
              {PROCESS_STEPS.map((step, index) => (
                <div key={step.title} className="feature-card">
                  <div className="feature-icon">
                    <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{index + 1}</span>
                  </div>
                  <h3 className="feature-title">{step.title}</h3>
                  <p className="feature-description">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className="home-services">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">What We Offer</span>
              <h2 className="section-title">Our Services</h2>
              <p className="section-description">
                From equipment rentals to full party styling, we've got you covered.
              </p>
            </div>
            
            <div className="services-grid">
              <div className="service-card">
                <img 
                  src="/imgs/rentalItems/img_5.png" 
                  alt="Party equipment rentals" 
                  className="service-image"
                  loading="lazy"
                />
                <div className="service-content">
                  <h3 className="service-title">Party Equipment Rentals</h3>
                  <p className="service-description">
                    Bouncy castles, tables, chairs, tents, and entertainment 
                    equipment for any event size.
                  </p>
                  <Link to="/Rentals" className="service-link">
                    View Rentals <span>→</span>
                  </Link>
                </div>
              </div>
              
              <div className="service-card">
                <img 
                  src="/imgs/decor.png" 
                  alt="Full party styling service" 
                  className="service-image"
                  loading="lazy"
                />
                <div className="service-content">
                  <h3 className="service-title">Full Party Styling</h3>
                  <p className="service-description">
                    Complete decoration packages with balloons, backdrops, 
                    centerpieces, and themed setups.
                  </p>
                  <Link to="/Contact" className="service-link">
                    Get a Quote <span>→</span>
                  </Link>
                </div>
              </div>
              
              <div className="service-card">
                <img 
                  src="/imgs/rentalItems/shopItems.png" 
                  alt="Party supplies shop" 
                  className="service-image"
                  loading="lazy"
                />
                <div className="service-content">
                  <h3 className="service-title">Party Supply Shop</h3>
                  <p className="service-description">
                    Buy decorations, party favors, balloons, and supplies 
                    for DIY party planning.
                  </p>
                  <Link to="/Shop" className="service-link">
                    Browse Shop <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED RENTALS */}
        {suggestedRentals.length > 0 && (
          <section className="home-featured">
            <div className="container">
              <div className="section-header">
                <span className="section-kicker">Popular Choices</span>
                <h2 className="section-title">Featured Rentals</h2>
                <p className="section-description">
                  Check out our most popular party rental items.
                </p>
              </div>
              
              <div className="featured-grid">
                {suggestedRentals.map((rental) => (
                  <Link 
                    key={rental.id} 
                    to={`/Rentals/${rental.slug || rental.id}`}
                    className="rental-card"
                  >
                    <div className="rental-image-container">
                      <img 
                        src={rental.image || rental.imageUrl || '/imgs/placeholder.png'} 
                        alt={rental.name}
                        className="rental-image"
                        loading="lazy"
                      />
                      <span className="rental-tag">
                        {rental.specificCategory || rental.category}
                      </span>
                    </div>
                    <div className="rental-content">
                      <h3 className="rental-title">{rental.name}</h3>
                      <p className="rental-description">
                        {rental.description || 'Professional rental item available for your event.'}
                      </p>
                      <div className="rental-price">
                        <div>
                          <span className="rental-price-value">
                            GHS {rental.price || rental.dailyRate || 'Contact'}
                          </span>
                          {(rental.price || rental.dailyRate) && (
                            <span className="rental-price-label"> / day</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="section-header">
                <Link to="/Rentals" className="btn btn-primary btn-lg">
                  View All Rentals
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA SECTION */}
        <section className="home-cta">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Plan Your Party?</h2>
            <p className="cta-description">
              Get in touch with the REEBS team today. We'll help you create 
              an unforgettable celebration that your guests will talk about for years!
            </p>
            <div className="cta-actions">
              <a href="tel:+233244238419" className="cta-chip">
                <AppIcon icon={faPhone} />
                <span>Call Us</span>
              </a>
              <a 
                href="https://wa.me/233244238419" 
                className="cta-chip"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <AppIcon icon={faWhatsapp} />
                <span>WhatsApp</span>
              </a>
              <a href="mailto:info@reebspartythemes.com" className="cta-chip">
                <AppIcon icon={faEnvelope} />
                <span>Email</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
