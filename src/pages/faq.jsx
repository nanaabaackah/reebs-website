import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faClock, faTruck, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

import './master.css';

const faqSections = [
    {
        category: 'Planning & booking',
        kicker: 'Start here',
        blurb: 'What you need to know before locking in a date with REEBS.',
        items: [
            {
                question: 'How do I book rentals or a full setup?',
                answer: 'Reserve rentals online or send us your date, venue, and theme. We confirm availability fast, share a simple quote, and secure your spot once payment is received.'
            },
            {
                question: 'How early should I book?',
                answer: 'Weekends fill up fast. Book rentals 1-2 weeks ahead when you can; full styling is best 2-4 weeks out. Same-day or next-day requests are possible. Call or WhatsApp to check.'
            },
            {
                question: 'Can you help me pick a theme?',
                answer: 'Absolutely. Tell us the vibe, guest count, and budget. We’ll suggest rentals, balloons, and decor and can share a mini moodboard so you know exactly what’s coming.'
            }
        ]
    },
    {
        category: 'Delivery, setup & pickup',
        kicker: 'Logistics',
        blurb: 'How your items get to you and back home.',
        items: [
            {
                question: 'Do you deliver and pick up?',
                answer: 'Yes. We schedule 1-hour delivery windows across Accra, Tema, and beyond. Pickups are collected the same day or next morning depending on your venue hours.'
            },
            {
                question: 'Will your team handle setup?',
                answer: 'For full styling packages we set up and tear down. Rentals-only orders are drop-off, but we can add setup and strike for an extra fee; just let us know you need it.'
            },
            {
                question: 'What happens if plans change?',
                answer: 'Tell us as soon as you can. We’ll do our best to adjust to a new address or time; some changes may update your delivery fee or setup window.'
            }
        ]
    },
    {
        category: 'Payments & policies',
        kicker: 'Details',
        blurb: 'How we hold your date and handle changes.',
        items: [
            {
                question: 'Do I pay a deposit?',
                answer: 'Yes, payment secures your inventory and team. The balance (if any) is due before delivery or setup.'
            },
            {
                question: 'Can I reschedule or cancel?',
                answer: 'Reschedules are free when inventory is available. Cancellations may be subject to fees depending on notice and custom items reserved.'
            },
            {
                question: 'Is there a security fee?',
                answer: 'Some items require a refundable security fee. We’ll flag it on your quote and return it once everything is collected in good condition.'
            }
        ]
    },
    {
        category: 'Care & special requests',
        kicker: 'Good to know',
        blurb: 'Keeping items party-ready and tailored to you.',
        items: [
            {
                question: 'How do you clean rentals?',
                answer: 'Every item is sanitized and checked before it leaves our studio. Bouncy castles are wiped down on-site during setup.'
            },
            {
                question: 'Can you do custom balloon colors or backdrops?',
                answer: 'Yes! Share a moodboard or hex codes and we’ll match or blend colors. We can also fabricate themed backdrops on request.'
            },
            {
                question: 'Do you travel outside Accra/Tema?',
                answer: 'We do. Travel fees depend on distance, timing, and the crew required. Tell us your venue and we’ll confirm the best option.'
            }
        ]
    }
];

function FAQ() {
    return (
        <div className="faq-page">
            <main className="faq-shell" id="main">
                <section className="faq-hero" aria-labelledby="faq-heading">
                    <div className="faq-hero-grid">
                        <div className="faq-hero-copy">
                            <p className="kicker">Answers in a snap</p>
                            <h1 id="faq-heading">REEBS FAQ</h1>
                            <p className="hero-sub">
                                Quick answers on rentals, styling, and delivery. If you want a human right now, tap one of the
                                buttons below - we love planning parties.
                            </p>
                            <div className="faq-meta-chips" aria-label="Highlights">
                                <span>Same-day delivery windows</span>
                                <span>Setup & teardown available</span>
                                <span>Custom themes welcome</span>
                            </div>
                            <div className="faq-actions" role="group" aria-label="Reach out">
                                <Link className="hero-btn hero-btn-primary" to="/contact">Chat with a planner</Link>
                                <Link className="hero-btn hero-btn-ghost" to="/rentals">View rentals</Link>
                                <a className="hero-btn hero-btn-link" href="tel:+233244238419">
                                    <FontAwesomeIcon icon={faPhone} /> Call us
                                </a>
                            </div>
                            <p className="faq-response-time">
                                <FontAwesomeIcon icon={faClock} /> Fast replies between 8:30am - 7pm (Mon-Sat)
                            </p>
                        </div>
                        <div className="faq-hero-card glass-card" aria-label="Popular quick answers">
                            <div className="faq-hero-card-top">
                                <p className="kicker">Quick facts</p>
                                <h3>Before you book</h3>
                            </div>
                            <ul className="faq-hero-list">
                                <li>
                                    <FontAwesomeIcon icon={faCalendarCheck} aria-hidden="true" />
                                    <span>Lock your date early - weekends go first.</span>
                                </li>
                                <li>
                                    <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
                                    <span>Delivery + pickup anywhere in Ghana; fees vary by distance.</span>
                                </li>
                                <li>
                                    <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
                                    <span>WhatsApp for fastest confirmations: +233 24 423 8419.</span>
                                </li>
                            </ul>
                            <div className="faq-hero-card-actions">
                                <a className="hero-btn hero-btn-primary" href="https://wa.me/233244238419" target="_blank" rel="noreferrer">
                                    Message on WhatsApp
                                </a>
                                <a className="hero-btn hero-btn-ghost" href="mailto:info@reebspartythemes.com">
                                    Email the team
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="faq-grid" aria-label="Frequently asked questions">
                    {faqSections.map((section) => (
                        <article className="faq-card glass-card" key={section.category}>
                            <div className="faq-card-header">
                                <p className="kicker">{section.kicker}</p>
                                <h3>{section.category}</h3>
                                <p className="faq-card-blurb">{section.blurb}</p>
                            </div>
                            <div className="faq-items" role="list">
                                {section.items.map((item, index) => (
                                    <details className="faq-item" key={item.question} open={index === 0}>
                                        <summary>
                                            <span>{item.question}</span>
                                            <span className="faq-chevron" aria-hidden="true">›</span>
                                        </summary>
                                        <div className="faq-answer">
                                            <p>{item.answer}</p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </article>
                    ))}
                </section>

                <section className="faq-cta" aria-labelledby="faq-cta-heading">
                    <div className="faq-cta-content glass-card">
                        <div>
                            <p className="kicker">Still curious?</p>
                            <h2 id="faq-cta-heading">Tell us about your party</h2>
                            <p className="faq-cta-sub">
                                Share your date, guest count, and vibe. We’ll reply with recommendations, pricing, and next steps.
                            </p>
                        </div>
                        <div className="faq-cta-actions" role="group" aria-label="Contact options">
                            <Link className="hero-btn hero-btn-primary" to="/contact">Start a brief</Link>
                            <a className="hero-btn hero-btn-ghost" href="tel:+233244238419">
                                <FontAwesomeIcon icon={faPhone} /> Call now
                            </a>
                            <a className="hero-btn hero-btn-link" href="https://wa.me/233244238419" target="_blank" rel="noreferrer">
                                <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default FAQ;
