import React, { useEffect, useState } from 'react';
import CookieBanner from '/src/components/CookieBanner';
import InstagramFeed from '/src/components/InstagramFeed';
import { Link } from 'react-router-dom';

import './master.css';

function About() {
    const [rentalsCount, setRentalsCount] = useState(null);
    const [productsCount, setProductsCount] = useState(null);
    const [theme, setTheme] = useState(() => {
        if (typeof document === 'undefined') return 'light';
        return document.documentElement.getAttribute('data-theme') || 'light';
    });

    useEffect(() => {
        let isMounted = true;
        const loadCounts = async () => {
            try {
                // 1. Fetch only the single combined endpoint (inventory.js)
                const productsRes = await fetch("/.netlify/functions/inventory");
                
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    
                    if (isMounted) {
                        const records = Array.isArray(data) ? data : [];
                        const rentals = records.filter(item => (item.sourceCategoryCode || item.sourcecategorycode || '').toString().toLowerCase() === 'rental');
                        const products = records.filter(item => {
                            const source = (item.sourceCategoryCode || item.sourcecategorycode || '').toString().toLowerCase();
                            if (!source) return true;
                            return source !== 'rental';
                        });

                        setRentalsCount(rentals.length);
                        setProductsCount(products.length);
                    }
                }
            } catch (err) {
                console.error("Error loading counts:", err);
            }
        };

        loadCounts();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const updateTheme = () => setTheme(root.getAttribute('data-theme') || 'light');
        const observer = new MutationObserver(updateTheme);
        observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        updateTheme();
        return () => observer.disconnect();
    }, []);

    const ownerImage = theme === 'dark' ? '/imgs/owner2.png' : '/imgs/owner.png';
    const values = [
        {
            title: 'Playful design with polish',
            copy: 'Modern palettes, curated props, and on-trend styling that still feels warm and family-friendly.'
        },
        {
            title: 'Zero-stress coordination',
            copy: 'We plan logistics, timelines, and vendor handoffs so you can stay present with your guests.'
        },
        {
            title: 'Safety first, always',
            copy: 'Sanitized rentals, kid-safe setups, and trained crew members who care about every detail.'
        },
        {
            title: 'Flexible for every budget',
            copy: 'From DIY party boxes to full-service decor, we tailor packages to what matters most to you.'
        }
    ];

   const highlights = [
        { label: 'Rental items', value: rentalsCount ? `${rentalsCount}+` : '…' },
        { label: 'Shop items', value: productsCount ? `${productsCount}+` : '…' },
        { label: 'Parties styled', value: '2k+' },
        { label: 'Cities served', value: '6+' },
        { label: 'Average response', value: 'under 1 hr' }
    ];

    const badges = [
        'Ghana-wide delivery',
        'Same-day options',
        'Free planning consult',
        'Kid-friendly crew'
    ];

    return (
        <>
            <a href="#main" className="skip-link">Skip to main content</a>
            <CookieBanner />
            <main className="about" role="main" id="main">
                <section id="r2-intro" className="about-hero" aria-labelledby="about-heading about-tagline">
                    <div className="about-hero-copy">
                        <h1 id="about-heading">Sleek setups. Joyful memories.</h1>
                        <p id="about-tagline" className="about-lede">
                            REEBS Party Themes is your go-to team for playful, design-forward celebrations.
                            We pair modern decor with dependable logistics so you can show up, smile, and soak
                            in every moment.
                        </p>
                        <div className="about-tags" aria-label="What you can expect from us">
                            {badges.map((item) => (
                                <span key={item} className="about-pill">{item}</span>
                            ))}
                        </div>
                        <div className="hero-ctas" aria-label="About page actions">
                            <Link className="hero-btn hero-btn-primary" to="/Rentals">Browse rentals</Link>
                            <Link className="hero-btn hero-btn-ghost" to="/Contact">Plan with us</Link>
                        </div>
                    </div>
                    {/*<div className="about-hero-media">
                        <div className="about-photo">
                            <img
                                src="/imgs/r4_b.png"
                                alt=""
                                loading="lazy"
                            />
                        </div>
                    </div>*/}
                </section>
                <section id='r2-info' className="about-highlights" aria-label="Company highlights">
                    <div className="about-metrics" aria-label="Highlights">
                        <h2>By the numbers</h2>
                        {highlights.map((item) => (
                            <div key={item.label}>
                                <strong>{item.value}</strong>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section id='r2-mto' className="about-mto bees-swoop" >
                    <div className='r2-back-image'>
                        <figure>
                            <img
                                src={ownerImage}
                                alt="Portrait of Sabina Ackah, founder of REEBS Party Themes"
                            />
                            <figcaption className="sr-only">Sabina Ackah, founder of REEBS Party Themes</figcaption>
                        </figure>
                    </div>
                    <div className='r2-mto-back-heading'>
                        <h2>Meet the Owner</h2>
                        <p>
                        Our founder, <strong>Sabina Ackah</strong>, brings a wealth of creativity and 
                        organizational expertise to every project. With an eye for design and a deep 
                        passion for event planning, she ensures that each client’s vision is met with 
                        precision and flair.
                        </p>
                    </div>
                </section>
                <section className="home-section about-mission bees-swoop alt2" aria-labelledby="mission-heading">
                    <div className="section-header">
                        <p className="kicker">What drives us</p>
                        <h2 id="mission-heading">Our mission & promise</h2>
                    </div>
                    <div className="about-grid">
                        <div className="about-card glass-card">
                            <h3>Memorable without the mayhem</h3>
                            <p>
                                We design parties that feel intentional and immersive, then back them with
                                punctual delivery, sanitized rentals, and friendly coordinators who keep
                                everything on track.
                            </p>
                            <ul className="about-list">
                                <li><span>▪</span><span>Curated themes and decor that feel fresh every season.</span></li>
                                <li><span>▪</span><span>Clear timelines so you always know what happens next.</span></li>
                                <li><span>▪</span><span>Flexible options: full setup, partial styling, or DIY kits.</span></li>
                            </ul>
                        </div>
                        <div className="about-card glass-card about-highlight">
                            <h3>Local roots. Wide reach.</h3>
                            <p>
                                We call Ghana home and proudly serve families, schools, and brands across
                                Accra, Kumasi, Cape Coast, Takoradi, and beyond.
                            </p>
                            <div className="about-pill-row">
                                <span className="about-pill">Corporate family days</span>
                                <span className="about-pill">Kid birthdays</span>
                                <span className="about-pill">School funfairs</span>
                                <span className="about-pill">Bridal & baby showers</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="home-section about-values " aria-labelledby="values-heading">
                    <div className="section-header">
                        <p className="kicker">How we show up</p>
                        <h2 id="values-heading">Values you can feel on party day</h2>
                    </div>
                    <ul className="about-values-grid">
                        {values.map((item) => (
                            <li key={item.title} className="about-card glass-card">
                                <h3>{item.title}</h3>
                                <p>{item.copy}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="home-section about-cta" aria-labelledby="cta-heading">
                    <div className="section-header">
                        <p className="kicker">Ready when you are</p>
                        <h2 id="cta-heading">Let’s make your party effortless</h2>
                        <h3>Tell us the theme, we’ll handle the sparkle.</h3>
                    </div>
                    <div className="cta-actions">
                        <a href="tel:+233244238419" className="cta-chip" aria-label="Call REEBS Party Themes">
                            Call us
                        </a>
                        <a
                            href="https://wa.me/233244238419"
                            className="cta-chip"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Chat with us on WhatsApp"
                        >
                            WhatsApp
                        </a>
                        <a href="mailto:info@reebspartythemes.com" className="cta-chip" aria-label="Email REEBS Party Themes">
                            Email
                        </a>
                    </div>
                </section>
            </main>
        </>
    )
}

export default About;
