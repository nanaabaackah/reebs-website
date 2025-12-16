import React from 'react';

function ContactForm() {
    const today = new Date().toISOString().split('T')[0];

    return (
        <form 
            className="contact-form"
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

            <p className="contact-form-note">We reply within one business day with availability and options.</p>

            <div className="contact-form-grid">
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
                        placeholder="+233 12 345 6789"
                        pattern="^[0-9+\\-()\\s]{7,}$"
                        required
                    />
                    <small className="hint">WhatsApp or mobile preferred.</small>
                </div>
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

            <div className="form-footer">
                <small className="hint">Need it fast? Call or WhatsApp for same-day options.</small>
                <button type="submit" className="btn btn-primary">Send message</button>
            </div>
        </form>
    );
}

export default ContactForm;
