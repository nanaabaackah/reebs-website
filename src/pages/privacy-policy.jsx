import React from 'react';
import './master.css';

const policySections = [
  {
    id: 'information',
    kicker: '1. What we collect',
    title: 'Information We Collect',
    description: 'We only ask for what helps us plan and deliver your celebration.',
    items: [
      'Personal details (name, email, phone, event notes) when you fill out a form or contact us.',
      'Usage data like pages visited, time on site, and browser type via Google Analytics.',
      'Device and approximate location when you view our store on Google Maps (only if you allow it).',
      'Social content you interact with from TikTok, Facebook, and Instagram embeds.'
    ]
  },
  {
    id: 'usage',
    kicker: '2. How we use it',
    title: 'How We Use Your Information',
    description: 'Your data powers smooth bookings and a better site experience.',
    items: [
      'Replying to inquiries and delivering rentals, decor, or supplies.',
      'Improving site performance and spotting what visitors enjoy most.',
      'Showing location-based info like maps and nearby services.',
      'Curating social media highlights for inspiration.',
      'Sending updates or offers if you opt in via WhatsApp or our forms.'
    ]
  },
  {
    id: 'rights',
    kicker: '3. Your control',
    title: 'Your Rights',
    description: 'Under Ghana’s Data Protection Act and global standards, you can:',
    items: [
      'Request access to the data we hold about you.',
      'Ask us to correct or delete your data.',
      'Withdraw consent for marketing messages at any time.'
    ]
  },
  {
    id: 'care',
    kicker: '4. Data care',
    title: 'Retention & Security',
    description: 'We minimize what we store and secure what we keep.',
    items: [
      'Contact details are typically retained for up to 12 months for service history.',
      'We secure data with HTTPS, form validation, and limited third-party access.',
      'We update this policy as tools change and note the new effective date.'
    ]
  }
];

const thirdParties = [
  { name: 'Netlify', detail: 'Hosts our site and may log basic metadata (e.g., IP, request time).' },
  { name: 'Zapier', detail: 'Automates bringing TikTok, Facebook, and Instagram posts into our feed.' },
  { name: 'Google Analytics', detail: 'Tracks anonymous usage to improve the experience.' },
  { name: 'Google Maps', detail: 'Shows store/event location if you permit location access.' },
  { name: 'WhatsApp', detail: 'Lets you message us directly for quotes or updates.' }
];

const PrivacyPolicy = () => {
  return (
    <main className="policy" role="main" id="policy-main">
      <section className="policy-hero" aria-labelledby="policy-heading">
        <div className="policy-hero-copy">
          <p className="policy-pill">Updated: July 2025</p>
          <h1 id="policy-heading">Privacy Policy</h1>
          <p className="policy-sub">
            At REEBS Party Themes, your details stay protected while we bring the fun. Here’s exactly
            how we collect, use, and care for your information.
          </p>
          <div className="policy-meta" aria-label="Policy highlights">
            <span className="policy-chip">GDPR-aligned</span>
            <span className="policy-chip">Ghana DPA ready</span>
            <span className="policy-chip">HTTPS everywhere</span>
          </div>
        </div>
        <div className="policy-hero-card glass-card">
          <p className="policy-hero-lede">Fast answers, no surprises.</p>
          <ul>
            <li>We only use data to run your event smoothly.</li>
            <li>No selling of data. Ever.</li>
            <li>Opt out anytime—one message is enough.</li>
          </ul>
          <div className="policy-ribbon">
            <span>Less hustle. More trust.</span>
          </div>
        </div>
        <span className="policy-bubble bubble-a" aria-hidden="true" />
        <span className="policy-bubble bubble-b" aria-hidden="true" />
        <span className="policy-bubble bubble-c" aria-hidden="true" />
      </section>

      <section className="policy-highlights" aria-labelledby="policy-quick-look">
        <div className="section-header">
          <p className="kicker">Quick look</p>
          <h2 id="policy-quick-look">How your data moves</h2>
        </div>
        <div className="policy-grid">
          <article className="policy-card">
            <p className="policy-card-kicker">Collect</p>
            <h3>When you reach out</h3>
            <p>Forms, WhatsApp, and bookings capture just enough info to plan your party.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Protect</p>
            <h3>Secured in transit</h3>
            <p>HTTPS on every page plus minimal third-party access keeps your details safe.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Control</p>
            <h3>Your say, always</h3>
            <p>Ask for your data, correct it, delete it, or opt out of marketing anytime.</p>
          </article>
        </div>
      </section>

      <section className="policy-sections" aria-label="Policy details">
        {policySections.map((section) => (
          <article key={section.id} className="policy-detail" id={section.id}>
            <p className="policy-card-kicker">{section.kicker}</p>
            <div className="policy-detail-header">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="policy-third" aria-labelledby="third-parties-heading">
        <div className="section-header">
          <p className="kicker">Trusted tools</p>
          <h2 id="third-parties-heading">Third-party partners</h2>
          <p className="policy-sub">
            We pick reputable platforms to deliver features like analytics, maps, and messaging.
            Each service only accesses the data it needs.
          </p>
        </div>
        <ul className="policy-third-grid">
          {thirdParties.map((service) => (
            <li key={service.name} className="policy-third-card">
              <p className="policy-card-kicker">{service.name}</p>
              <p>{service.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="policy-cta" aria-labelledby="policy-cta-heading">
        <div>
          <p className="kicker">Need clarity?</p>
          <h2 id="policy-cta-heading">Talk to the REEBS team</h2>
          <p className="policy-sub">
            Ask for your data, request deletion, or change how we contact you. We respond quickly.
          </p>
        </div>
        <div className="policy-contact">
          <a href="mailto:info@reebspartythemes.com" className="policy-chip solid">info@reebspartythemes.com</a>
          <a href="https://wa.me/233244238419" className="policy-chip" target="_blank" rel="noopener noreferrer">
            WhatsApp: +233 244 238 419
          </a>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
