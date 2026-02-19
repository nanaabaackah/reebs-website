import React from 'react';
import './public.css';

const deliverySections = [
  {
    id: 'windows',
    kicker: '1. Timing',
    title: 'Delivery & pickup windows',
    description: 'We keep your schedule tight, with clear communication.',
    items: [
      'Standard delivery windows: 1-hour slots across Accra, Tema, and nearby areas.',
      'We text/WhatsApp when we’re en route and on arrival.',
      'Pickup is same day or next morning depending on your venue hours; we’ll confirm during booking.',
      'Need late-night or early-morning service? We can arrange it for an added convenience fee.'
    ]
  },
  {
    id: 'coverage',
    kicker: '2. Coverage',
    title: 'Where we deliver',
    description: 'From neighborhood backyards to event halls, we’ve got you covered.',
    items: [
      'Accra & Tema: full coverage with standard rates.',
      'Greater Accra & Eastern: available with adjusted fees based on distance and crew time.',
      'High-rise or multi-level deliveries may require an extra hand or lift access—let us know in advance.'
    ]
  },
  {
    id: 'setup',
    kicker: '3. Setup',
    title: 'Setup & placement',
    description: 'We place items where you need them and confirm power and safety.',
    items: [
      'Bouncy castles and machines require stable ground and safe power sources; our team will guide placement.',
      'Decor installs include basic styling and safety checks; complex builds may require longer windows.',
      'If a location change is requested on arrival, timing may shift and fees may be adjusted.'
    ]
  },
  {
    id: 'care',
    kicker: '4. Care on-site',
    title: 'While rentals are with you',
    description: 'Keep things fun and safe until pickup.',
    items: [
      'Keep inflatables away from sharp objects, open flames, and heavy winds.',
      'Do not relocate electrical equipment without our approval.',
      'Please have an adult present during delivery and pickup to sign off on condition.'
    ]
  },
  {
    id: 'fees',
    kicker: '5. Fees',
    title: 'Delivery fees & changes',
    description: 'No hidden extras—just clear rates.',
    items: [
      'Fees are based on distance, vehicle type, and crew size.',
      'Stairs-only access or difficult parking may add a handling fee (we’ll flag it in your quote).',
      'Address or time changes may update your delivery fee; we’ll confirm before proceeding.'
    ]
  }
];

const DeliveryPolicy = () => {
  return (
    <main className="policy" role="main" id="policy-main">
      <section className="policy-hero" aria-labelledby="delivery-heading">
        <div className="policy-hero-copy">
          <p className="policy-pill">Updated: July 2025</p>
          <h1 id="delivery-heading">Delivery Policy</h1>
          <p className="policy-sub">
            Smooth drop-offs, careful setup, and on-time pickups—so the only surprise is how good your party looks.
          </p>
          <div className="policy-meta" aria-label="Delivery highlights">
            <span className="policy-chip">1-hour windows</span>
            <span className="policy-chip">Live updates</span>
            <span className="policy-chip">Safety first</span>
          </div>
        </div>
        <div className="policy-hero-card glass-card">
          <p className="policy-hero-lede">Fun arrives ready to go.</p>
          <ul>
            <li>We confirm the best route and time before dispatch.</li>
            <li>Setup includes safety checks for power and placement.</li>
            <li>Pickups match your venue hours—no lingering gear.</li>
          </ul>
          <div className="policy-ribbon">
            <span>Less hustle. More on-time magic.</span>
          </div>
        </div>
        <span className="policy-bubble bubble-a" aria-hidden="true" />
        <span className="policy-bubble bubble-b" aria-hidden="true" />
        <span className="policy-bubble bubble-c" aria-hidden="true" />
      </section>

      <section className="policy-highlights" aria-labelledby="delivery-quick-look">
        <div className="section-header">
          <p className="kicker">Quick look</p>
          <h2 id="delivery-quick-look">What to expect</h2>
        </div>
        <div className="policy-grid">
          <article className="policy-card">
            <p className="policy-card-kicker">Routing</p>
            <h3>Smart scheduling</h3>
            <p>We batch routes to hit your window reliably, even on busy weekends.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Readiness</p>
            <h3>Tested & clean</h3>
            <p>Inflatables, decor, and machines are cleaned, tested, and pre-packed before dispatch.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Sign-off</p>
            <h3>Condition confirmed</h3>
            <p>We document setup and pickup condition with quick photos for everyone’s peace of mind.</p>
          </article>
        </div>
      </section>

      <section className="policy-sections" aria-label="Delivery policy details">
        {deliverySections.map((section) => (
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

      <section className="policy-cta" aria-labelledby="delivery-cta-heading">
        <div>
          <p className="kicker">Need a specific window?</p>
          <h2 id="delivery-cta-heading">Chat with logistics</h2>
          <p className="policy-sub">
            Ask about coverage, access requirements, or special delivery times before you book.
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

export default DeliveryPolicy;
