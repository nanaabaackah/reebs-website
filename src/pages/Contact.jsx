import React from 'react';
import CookieBanner from '/src/components/CookieBanner';
import Map from '/src/components/Map';
import { Link } from 'react-router-dom';
import ContactForm from '/src/components/ContactForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot, faClock } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import './master.css';

function Contact() {
    return (
        <div className="contact-page">
            <CookieBanner />
            <main className="contact-shell" id="main">
                <section className="contact-hero" aria-labelledby="contact-hero-heading">
                    <div className="contact-hero-grid">
                        <div className="contact-hero-copy">
                            <p className="kicker">Let's plan your party</p>
                            <h1 id="contact-hero-heading">Contact REEBS</h1>
                            <p className="hero-sub">
                                We’ll help with rentals, decor, or a full setup plan. Reach out and we’ll get you a
                                clear game plan fast.
                            </p>
                            <div className="contact-chips" aria-label="Quick highlights">
                                <span>Same-day delivery options</span>
                                <span>Custom themes</span>
                                <span>Friendly, fast replies</span>
                            </div>
                            <div className="contact-actions" role="group" aria-label="Ways to reach us">
                                <a className="hero-btn hero-btn-primary" href="tel:+233244238419">
                                    <FontAwesomeIcon icon={faPhone} /> Call us
                                </a>
                                <a
                                    className="hero-btn hero-btn-ghost"
                                    href="https://wa.me/233244238419"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                                </a>
                                <Link className="hero-btn hero-btn-link" to="/rentals">
                                    Plan my setup
                                </Link>
                            </div>
                            <div className="contact-meta">
                                <span><FontAwesomeIcon icon={faClock} /> 8:30am – 7pm (Mon–Sat)</span>
                                <span><FontAwesomeIcon icon={faLocationDot} /> Sakumono Broadway, Tema</span>
                            </div>
                        </div>
                        <div className="contact-hero-card" aria-label="Studio details">
                            <div className="contact-card-header">
                                <FontAwesomeIcon icon={faLocationDot} />
                                <div>
                                    <p className="kicker">Visit or pickup</p>
                                    <h2>Swing by our store</h2>
                                </div>
                            </div>
                            <p className="contact-hero-lede">
                                Stop by in person, grab balloons, or chat through ideas with our team.
                            </p>
                            <div className="contact-card-actions">
                                <a href="https://maps.app.goo.gl/ykfi2iVEBfEneTx16" target="_blank" rel="noreferrer" className="hero-btn hero-btn-ghost">
                                    Open in Maps
                                </a>
                                <a href="mailto:info@reebspartythemes.com" className="hero-btn hero-btn-link">
                                    info@reebspartythemes.com
                                </a>
                            </div>
                            <div className="contact-hours">
                                <div>
                                    <span>Weekdays</span>
                                    <strong>8:30am – 7pm</strong>
                                </div>
                                <div>
                                    <span>Saturday</span>
                                    <strong>8:30am – 7pm</strong>
                                </div>
                                <p className="contact-hours-note">
                                    We alternate some Mondays—call ahead to confirm. Holiday hours may vary.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="contact-info-grid" aria-label="Stay connected">
                    <article className="contact-card">
                        <div className="contact-card-header">
                            <FontAwesomeIcon icon={faPhone} />
                            <h3>Talk to a human</h3>
                        </div>
                        <p>Need quick answers on availability or pricing? Call or text and we’ll confirm details right away.</p>
                        <div className="contact-links">
                            <a href="tel:+233244238419">+233 24 423 8419</a>
                            <a href="https://wa.me/233244238419" target="_blank" rel="noreferrer">Message on WhatsApp</a>
                        </div>
                    </article>
                    <article className="contact-card">
                        <div className="contact-card-header">
                            <FontAwesomeIcon icon={faEnvelope} />
                            <h3>Send a brief</h3>
                        </div>
                        <p>Share your theme, date, guest count, and budget. We’ll reply within one business day with options.</p>
                        <div className="contact-links">
                            <a href="mailto:info@reebspartythemes.com">info@reebspartythemes.com</a>
                            <Link to="/faq">View FAQs</Link>
                        </div>
                    </article>
                    <article className="contact-card">
                        <div className="contact-card-header">
                            <FontAwesomeIcon icon={faFacebook} />
                            <h3>Follow along</h3>
                        </div>
                        <p>See new setups, balloons, and party inspo from events across Ghana.</p>
                        <div className="contact-socials">
                            <a href="https://www.facebook.com/reebspartythemes" target="_blank" rel="noreferrer" aria-label="Facebook">
                                <FontAwesomeIcon icon={faFacebook} />
                            </a>
                            <a href="https://www.instagram.com/reebspartythemes_/" target="_blank" rel="noreferrer" aria-label="Instagram">
                                <FontAwesomeIcon icon={faInstagram} />
                            </a>
                            <a href="https://www.tiktok.com/@reebspartythemes_" target="_blank" rel="noreferrer" aria-label="TikTok">
                                <FontAwesomeIcon icon={faTiktok} />
                            </a>
                        </div>
                    </article>
                </section>

                <section className="contact-panels" aria-label="Send a message or find us">
                    <article className="contact-card contact-form-card">
                        <div className="contact-card-header">
                            <p className="kicker">Tell us about your event</p>
                            <h3>Send a message</h3>
                        </div>
                        <p className="contact-card-intro">
                            We’ll confirm availability, pricing, and next steps within one business day.
                        </p>
                        <ContactForm />
                    </article>
                    <article className="contact-card contact-map-card">
                        <div className="contact-card-header">
                            <p className="kicker">Find us</p>
                            <h3>Map & directions</h3>
                        </div>
                        <div className="map-wrapper">
                            <Map />
                        </div>
                        <div className="contact-card-intro">
                            <p>Use “Get Directions” on the map for a quick route from your location.</p>
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default Contact;
