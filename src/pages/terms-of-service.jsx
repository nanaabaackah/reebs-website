import React from 'react';
import './public.css';

const termsSections = [
  {
    id: 'acceptance',
    kicker: '1. Agreement',
    title: 'Acceptance of terms',
    description: 'By browsing, booking, or purchasing from REEBS Party Themes, you agree to these terms.',
    items: [
      'You confirm you are at least 18 or have guardian permission to place orders.',
      'You provide accurate contact, delivery, and payment information.',
      'You agree to communicate changes quickly so we can keep your booking on track.'
    ]
  },
  {
    id: 'bookings',
    kicker: '2. Bookings',
    title: 'Bookings & payments',
    description: 'We make reservations simple and transparent.',
    items: [
      'Quotes are valid for 5 business days unless otherwise stated.',
      'Full payment (or agreed deposit) secures inventory, decor, and crew.',
      'Outstanding balances are due before delivery or setup begins.',
      'Promotions or discounts cannot be combined unless explicitly stated.'
    ]
  },
  {
    id: 'rentals',
    kicker: '3. Rentals',
    title: 'Rental care & responsibility',
    description: 'Keep rentals safe and ready for the next celebration.',
    items: [
      'You are responsible for rentals from drop-off to pickup.',
      'Do not sub-rent or loan items to third parties without written approval.',
      'Damage, loss, or excessive cleaning may incur repair or replacement fees.',
      'Follow all safety instructions for inflatables, electrical items, and decor.'
    ]
  },
  {
    id: 'decor',
    kicker: '4. Decor & styling',
    title: 'Custom decor & styling',
    description: 'We tailor designs to your brief while maintaining safety and venue rules.',
    items: [
      'Renderings and moodboards represent intent; slight variations may occur on-site.',
      'Venue restrictions (tape, balloons, rigging) must be disclosed during booking.',
      'We remove decor we installed unless otherwise agreed in writing.'
    ]
  },
  {
    id: 'liability',
    kicker: '5. Liability',
    title: 'Safety & liability',
    description: 'We prioritize safety for guests, equipment, and venues.',
    items: [
      'Our team performs safety checks at setup; please maintain safe use afterward.',
      'REEBS is not liable for injuries arising from misuse or unsupervised play.',
      'In the unlikely event of service failure, our liability is limited to the amounts paid for that booking.'
    ]
  },
  {
    id: 'changes',
    kicker: '6. Changes',
    title: 'Policy updates',
    description: 'We refine these terms as we grow.',
    items: [
      'Updates take effect when posted on this page with the new date.',
      'If material changes affect an active booking, we will notify you via your provided contact.'
    ]
  }
];

const TermsOfService = () => {
  return (
    <main className="policy" role="main" id="policy-main">
      <section className="policy-hero" aria-labelledby="tos-heading">
        <div className="policy-hero-copy">
          <p className="policy-pill">Updated: July 2025</p>
          <h1 id="tos-heading">Terms of Service</h1>
          <p className="policy-sub">
            The friendly fine print for rentals, decor, and party supplies—built to keep every booking smooth.
          </p>
          <div className="policy-meta" aria-label="Terms highlights">
            <span className="policy-chip">Clear bookings</span>
            <span className="policy-chip">Safety focused</span>
            <span className="policy-chip">Fair use</span>
          </div>
        </div>
        <div className="policy-hero-card glass-card">
          <p className="policy-hero-lede">Know what to expect before we roll up.</p>
          <ul>
            <li>Paying secures inventory, decor, and crew.</li>
            <li>Keep rentals safe; report issues quickly.</li>
            <li>We keep liability fair and transparent.</li>
          </ul>
          <div className="policy-ribbon">
            <span>Less hustle. More confidence.</span>
          </div>
        </div>
        <span className="policy-bubble bubble-a" aria-hidden="true" />
        <span className="policy-bubble bubble-b" aria-hidden="true" />
        <span className="policy-bubble bubble-c" aria-hidden="true" />
      </section>

      <section className="policy-highlights" aria-labelledby="tos-quick-look">
        <div className="section-header">
          <p className="kicker">Quick look</p>
          <h2 id="tos-quick-look">What these terms cover</h2>
        </div>
        <div className="policy-grid">
          <article className="policy-card">
            <p className="policy-card-kicker">Bookings</p>
            <h3>Reservations that stick</h3>
            <p>Quotes hold items briefly; payment locks them in along with your setup crew.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Use</p>
            <h3>Care in your space</h3>
            <p>Follow safety guidance for inflatables, decor installs, and powered equipment.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Accountability</p>
            <h3>Fair remedies</h3>
            <p>Issues? We work quickly to resolve them; liability is limited to what you paid for the booking.</p>
          </article>
        </div>
      </section>

      <section className="policy-sections" aria-label="Terms of service details">
        {termsSections.map((section) => (
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

      <section className="policy-cta" aria-labelledby="tos-cta-heading">
        <div>
          <p className="kicker">Questions?</p>
          <h2 id="tos-cta-heading">Chat with REEBS</h2>
          <p className="policy-sub">
            Clarify booking rules, ask about safety guidelines, or request a copy of these terms.
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

export default TermsOfService;
