import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './master.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import PopupModal from '/src/components/PopupModal';
import TypingEffect from '/src/components/TypingEffect';
import CookieBanner from '/src/components/CookieBanner';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

function Home() {
    const [suggestedRentals, setSuggestedRentals] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [heroVideoSrc, setHeroVideoSrc] = useState(null);
    const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                // 1. Fetch only the single combined endpoint (inventory.js)
                const productsRes = await fetch("/.netlify/functions/inventory");
                
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    
                    if (isMounted) {
                        const records = Array.isArray(data) ? data : [];
                        const rentals = records.filter((item) => {
                            const source = (item.sourceCategoryCode || item.sourcecategorycode || '').toString().toLowerCase();
                            return source === 'rental';
                        });
                        const retail = records.filter((item) => {
                            const source = (item.sourceCategoryCode || item.sourcecategorycode || '').toString().toLowerCase();
                            if (!source) return true;
                            return source !== 'rental';
                        });

                        setSuggestedRentals(rentals.slice(0, 3));
                        setSuggestedProducts(retail.slice(0, 3));
                    }
                } else {
                    console.error(`Error fetching products: ${productsRes.status}`);
                }
            } catch (err) {
                console.error("Error loading data:", err);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (media.matches) return; // respect reduced motion; keep static background

        const heroEl = document.getElementById('r1-intro');
        if (!heroEl) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setHeroVideoSrc('/imgs/moving/background18.mp4');
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '250px 0px' }
        );

        observer.observe(heroEl);
        return () => observer.disconnect();
    }, []);

     const steps = [
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
    
        

    return (
        <>
            <a href="#main" className="skip-link">Skip to main content</a>
            <CookieBanner />
            <PopupModal />
            <main className="home" role="main" id="main">
                <section id="r1-intro" className="home-hero" aria-labelledby="home-hero-heading home-tagline">
                    <div className="hero-video-wrap" aria-hidden="true">
                        <video
                            className={`hero-video ${heroVideoLoaded ? 'is-visible' : ''}`}
                            src={heroVideoSrc || undefined}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            onLoadedData={() => setHeroVideoLoaded(true)}
                        />
                    </div>
                    <div className="hero-grid">
                        <div className="hero-copy">
                            <p className="hero-kicker">Party rentals, decor, and supplies across Ghana</p>
                            <h1 id="home-hero-heading">REEBS Party Themes</h1>
                            <h2 id="home-tagline" className="hero-tagline">
                                <span className="sr-only">We promise less hustle, more fun!</span>
                                <TypingEffect
                                    text="We promise less hustle, more fun!"
                                    speed={120}
                                    ariaHidden
                                    className="hero-typing"
                                />
                            </h2>
                            <p className="hero-sub">Bouncy castles, party planning, balloons, and curated party boxes delivered or set up for you.</p>
                            <div className="hero-ctas" aria-label="heading-buttons">
                                <Link className="hero-btn hero-btn-primary" to="/rentals">View Rentals</Link>
                                <Link className="hero-btn hero-btn-ghost" to="/shop">Explore Our Shop</Link>
                                <Link className="hero-btn hero-btn-link" to="/contact">Talk to Us</Link>
                            </div>
                            <div className="hero-stats" aria-label="Highlights">
                                <div>
                                    <strong>2k+</strong>
                                    <span>Happy parties</span>
                                </div>
                                <div>
                                    <strong>Same-day</strong>
                                    <span>Delivery available</span>
                                </div>
                                <div>
                                    <strong>Free</strong>
                                    <span>Planning consultation</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id='r1-info' className="home-section home-why" aria-labelledby="why-heading">
                    <div className="section-header">
                        <p className="kicker">Why choose us</p>
                        <h2 id="why-heading">Simple, Less hustle. More fun.</h2>
                    </div>
                    <ul className="why-grid">
                        <li>
                            <img 
                                src='/imgs/icons/easy.png' 
                                alt="" role="presentation"
                                loading="lazy"
                            />
                            <h3>Easy Booking</h3>
                            <p>Reserve online in minutes and we’ll confirm fast.</p>
                        </li>
                        <li>
                            <img 
                                src='/imgs/icons/delivery.png' 
                                alt="" role="presentation" 
                                loading="lazy"
                            />
                            <h3>Reliable Delivery</h3>
                            <p>On-time drop-offs and pickup windows that work for you.</p>
                        </li>
                        <li>
                            <img 
                                src='/imgs/icons/sanitize.png' 
                                alt="" role="presentation"
                                loading="lazy"
                            />
                            <h3>Sanitized Rentals</h3>
                            <p>Every item is cleaned and checked before it leaves.</p>
                        </li>
                        <li>
                            <img 
                                src='/imgs/icons/budget.png' 
                                alt="" role="presentation" 
                                loading="lazy"
                            />
                            <h3>Budget Flexibility</h3>
                            <p>Mix-and-match packages to fit your spend.</p>
                        </li>
                        <li>
                            <img 
                                src='/imgs/icons/support.png' 
                                alt="" role="presentation"
                                loading="lazy"
                            />
                            <h3>Fast Support</h3>
                            <p>Reach us by phone or WhatsApp for quick answers.</p>
                        </li>
                    </ul>
                </section>
                <section className="home-section about-steps" aria-labelledby="steps-heading">
                    <div className="section-header">
                        <p className="kicker">Our flow</p>
                        <h2 id="steps-heading">From idea to confetti</h2>
                    </div>
                    <ol className="about-step-list">
                        {steps.map((item, index) => (
                            <li key={item.title} className="about-card glass-card">
                                <span className="about-step-number">{index + 1}</span>
                                <div>
                                    <h3>{item.title}</h3>
                                    <p>{item.copy}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section id="r1-cta" className="home-section home-cta" aria-labelledby="cta1-heading">
                    <div className="section-header">
                        <p className="kicker">Need guidance?</p>
                        <h2 id="cta1-heading">Have any Questions?</h2>
                        <h3>Talk to the REEBS team today.</h3>
                    </div>
                    <div className="cta-actions">
                        <a href="tel:+233244238419" className="cta-chip" aria-label="Call REEBS Party Themes">
                            <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
                            <span>Call us</span>
                        </a>
                        <a href="https://wa.me/233244238419" className="cta-chip" target="_blank" rel="noopener noreferrer"
                            aria-label="Chat with us on WhatsApp">
                            <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
                            <span>WhatsApp</span>
                        </a>
                        <a href="mailto:info@reebspartythemes.com" className="cta-chip" aria-label="Email REEBS Party Themes">
                            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                            <span>Email</span>
                        </a>
                    </div>
                </section>

                <section id='r1-services' className="home-section home-services" aria-labelledby="services-heading">
                    <div className="section-header">
                        <p className="kicker">What we offer</p>
                        <h2 id="services-heading">Our Services</h2>
                    </div>
                    <ul className="services-grid">
                        <li>
                            <Link to="/Rentals#Kid's%20Party%20Rentals">
                                Party Equipment Rentals
                            </Link>
                            <p>Bouncy castles, popcorn machines, cotton candy, tents, tables, chairs, etc. for your events. Available for delivery or pickup.</p>
                        </li>
                        <li>
                            <Link to="/Shop">
                                Party Supplies & Gifts
                            </Link>
                            <p>Shop for birthday decorations, balloons, toys, stationery, and themed gift sets for all ages.</p>
                        </li>
                        <li>
                            <Link to="/Rentals#Event%20Decor%20&%20Setup">
                                Custom Event Decor
                            </Link>
                            <p>We design and set up decorations, table styling, and more.</p>
                        </li>
                        <li>
                            <Link to="/Rentals#Event%20Decor%20&%20Setup">
                                All-in-One Party Packages
                            </Link>
                            <p>Bundle your event with our curated packages: rental + decor + supplies = hassle-free parties.</p>
                        </li>
                        <li>
                            <Link to="/Contact">
                                Extended Vendor Network
                            </Link>
                            <p>Need something extra? We can outsource tents, catering, entertainment, and more via trusted partners.</p>
                        </li>
                        <li>
                            <Link to="/Contact">
                                Party Planning Help
                            </Link>
                            <p>Don’t know where to start? Book a free consultation to plan your celebration step-by-step.</p>
                        </li>
                    </ul>
                </section>

                <section className="home-section home-suggestions" aria-labelledby="suggestions-heading">
                    <div className="section-header">
                        <p className="kicker">Try these</p>
                        <h2 id="suggestions-heading">Popular picks right now</h2>
                    </div>
                    <div className="suggested-columns">
                        <div>
                            <h3>Top Rentals</h3>
                            <ul className="suggested-grid">
                                {suggestedRentals.map((item) => (
                                    <li key={item.id} className="suggested-card">
                                        <img
                                            src={item.image || item.imageUrl || '/imgs/placeholder.png'}
                                            alt=""
                                            aria-hidden="true"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="suggested-title">{item.name}</p>
                                            {(item.specificCategory || item.specificcategory) && <p className="suggested-meta">{item.specificCategory || item.specificcategory}</p>}
                                        </div>
                                        <Link to={`/Rentals#${encodeURIComponent(item.specificCategory || item.specificcategory || '')}`} className="suggested-link">
                                            View rental
                                        </Link>
                                    </li>
                                ))}
                                {suggestedRentals.length === 0 && <li className="suggested-placeholder">Rentals loading…</li>}
                            </ul>
                        </div>
                        <div>
                            <h3>Shop Favourites</h3>
                            <ul className="suggested-grid">
                                {suggestedProducts.map((item) => (
                                    <li key={item.id} className="suggested-card">
                                        <img
                                            src={item.image || item.imageUrl || '/imgs/placeholder.png'}
                                            alt=""
                                            aria-hidden="true"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="suggested-title">{item.name}</p>
                                            {(item.specificCategory || item.specificcategory) && <p className="suggested-meta">{item.specificCategory || item.specificcategory}</p>}
                                        </div>
                                        <Link to="/Shop" className="suggested-link">
                                            Shop now
                                        </Link>
                                    </li>
                                ))}
                                {suggestedProducts.length === 0 && <li className="suggested-placeholder">Shop items loading…</li>}
                            </ul>
                        </div>
                    </div>
                </section>

                <section id="r1-cta-b" className="home-section home-cta alt" aria-labelledby="cta2-heading">
                    <div className="section-header">
                        <p className="kicker">Ready to go?</p>
                        <h2 id="cta2-heading">Need Help Planning Your Kids' Party?</h2>
                        <h3>Contact Us Today!</h3>
                    </div>
                    <div className="cta-actions">
                        <a href="tel:+233244238419" className="cta-chip" aria-label="Call REEBS Party Themes">
                            <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
                            <span>Call us</span>
                        </a>
                        <a href="https://wa.me/233244238419" className="cta-chip" target="_blank" rel="noopener noreferrer"
                            aria-label="Chat with us on WhatsApp">
                            <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
                            <span>WhatsApp</span>
                        </a>
                        <a href="mailto:info@reebspartythemes.com" className="cta-chip" aria-label="Email REEBS Party Themes">
                            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                            <span>Email</span>
                        </a>
                    </div>
                </section>
            </main>
        </>
    )
}

export default Home;
