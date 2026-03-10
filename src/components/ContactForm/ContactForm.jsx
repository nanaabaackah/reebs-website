import React from 'react';

function ContactForm() {
    const today = new Date().toISOString().split('T')[0];

    return (
        <form 
            className="contact-form form-shell"
            name="contact"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
        >
            <input type="hidden" name="form-name" value="contact" />
            <p className="hidden">
                <label>
                Don’t fill this out: <input name="bot-field" />
                </label>
            </p>

            <div className="form-overview">
                <div className="form-overview-copy">
                    <p className="form-kicker">Quick brief</p>
                    <h4>Share the essentials</h4>
                    <p className="contact-form-note">We reply within one business day with availability and options.</p>
                </div>
                <div className="form-overview-metrics" aria-label="What to include">
                    <span>Theme</span>
                    <span>Date</span>
                    <span>Guest count</span>
                    <span>Budget</span>
                </div>
            </div>

            <section className="form-section" aria-labelledby="contact-form-contact-heading">
                <div className="form-section-head">
                    <p className="form-section-kicker">01</p>
                    <h4 id="contact-form-contact-heading">How we can reach you</h4>
                    <p>Share the best contact details so we can reply with the right options quickly.</p>
                </div>
                <div className="contact-form-grid form-section-grid">
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
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
                        <label htmlFor="phone">Phone number</label>
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
                        <small className="hint">WhatsApp or mobile preferred.</small>
                    </div>
                </div>
            </section>

            <section className="form-section" aria-labelledby="contact-form-event-heading">
                <div className="form-section-head">
                    <p className="form-section-kicker">02</p>
                    <h4 id="contact-form-event-heading">Event snapshot</h4>
                    <p>Give us the service, date, and location so we can match availability properly.</p>
                </div>
                <div className="contact-form-grid form-section-grid">
                    <div className="form-group">
                        <label htmlFor="topic">What do you need?</label>
                        <select id="topic" name="topic" defaultValue="" required>
                            <option value="" disabled>Select a service</option>
                            <option value="rentals">Party rentals</option>
                            <option value="full-setup">Full setup / styling</option>
                            <option value="balloons">Balloons & backdrops</option>
                            <option value="shop">Party supplies box</option>
                            <option value="other">Other</option>
                        </select>
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
                        <label htmlFor="location">Location / venue</label>
                        <input
                            id="location"
                            type="text"
                            name="location"
                            placeholder="Neighborhood or venue"
                            autoComplete="address-level2"
                        />
                    </div>
                </div>
            </section>

            <section className="form-section" aria-labelledby="contact-form-brief-heading">
                <div className="form-section-head">
                    <p className="form-section-kicker">03</p>
                    <h4 id="contact-form-brief-heading">Your brief</h4>
                    <p>Tell us the vibe, headcount, and must-haves so we can respond with focused options.</p>
                </div>
                <div className="contact-form-grid form-section-grid">
                    <div className="form-group full-width">
                        <label htmlFor="message">Tell us more</label>
                        <textarea
                            id="message"
                            name="message"
                            rows="5"
                            placeholder="Theme, guest count, budget range, must-haves..."
                            required
                        ></textarea>
                    </div>
                </div>
            </section>

            <div className="form-footer">
                <small className="hint">Need it fast? Call or WhatsApp for same-day options.</small>
                <button type="submit" className="btn btn-primary">Send planning brief</button>
            </div>
        </form>
    );
}

export default ContactForm;
