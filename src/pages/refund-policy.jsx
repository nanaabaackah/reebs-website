import React from 'react';
import './public.css';

const refundSections = [
  {
    id: 'cancellations',
    kicker: '1. Changing plans',
    title: 'Cancellations & tweaks',
    description: 'Life happens. Here’s how we handle shifts in your booking.',
    items: [
      'Hold requests are free until we confirm availability and send your invoice.',
      'Cancel within 48 hours of payment for a full refund on rentals and supplies.',
      'Cancel after 48 hours: 30% service fee to cover prep and reserved inventory.',
      'Same-week cancellations: delivery/setup fees are non-refundable; we credit rentals for a future date within 60 days.'
    ]
  },
  {
    id: 'reschedules',
    kicker: '2. New dates',
    title: 'Reschedules',
    description: 'We’ll always try to move with you when dates change.',
    items: [
      'One free reschedule if you give 72+ hours’ notice.',
      'Less than 72 hours: ₵150 retainer to secure crew and logistics.',
      'If the exact items are unavailable on the new date, we’ll suggest close alternatives or apply a credit to similar items.'
    ]
  },
  {
    id: 'weather',
    kicker: '3. Weather',
    title: 'Rainy-day backup',
    description: 'Ghana weather can surprise us; here’s our rainy-day flow.',
    items: [
      'Light rain: we proceed with covered setup or indoor placement when safe.',
      'Heavy rain or storms: we can pause delivery and reschedule without fees to the nearest available date.',
      'Partially delivered orders that pause for weather will have unused items credited for future use.'
    ]
  },
  {
    id: 'timing',
    kicker: '4. Refund timing',
    title: 'When refunds land',
    description: 'We process refunds quickly so you can plan your next celebration.',
    items: [
      'Processed within 3 business days after confirmation from our team.',
      'Bank or mobile money timelines may add 3–7 business days.',
      'Credits are issued instantly to your REEBS account email/phone.'
    ]
  },
  {
    id: 'exceptions',
    kicker: '5. Exceptions',
    title: 'Non-refundable items',
    description: 'A few items are purchased just for you and can’t be returned.',
    items: [
      'Custom-printed backdrops, balloons, or branded decor once ordered.',
      'Perishable goods like snacks or personalized favors after procurement.',
      'Severe damage to rentals (burns, tears, water damage beyond safe use).'
    ]
  }
];

const RefundPolicy = () => {
  return (
    <main className="policy" role="main" id="policy-main">
      <section className="policy-hero" aria-labelledby="refund-heading">
        <div className="policy-hero-copy">
          <p className="policy-pill">Updated: July 2025</p>
          <h1 id="refund-heading">Refund & Cancellation Policy</h1>
          <p className="policy-sub">
            Transparent steps for cancellations, reschedules, and weather surprises—so your party plans
            stay stress-free.
          </p>
          <div className="policy-meta" aria-label="Refund highlights">
            <span className="policy-chip">Fast processing</span>
            <span className="policy-chip">Flexible reschedules</span>
            <span className="policy-chip">No hidden fees</span>
          </div>
        </div>
        <div className="policy-hero-card glass-card">
          <p className="policy-hero-lede">Clear outcomes before you click pay.</p>
          <ul>
            <li>Cancel within 48 hours for a full refund.</li>
            <li>Weather issues? We reschedule first.</li>
            <li>Custom-made items are final sale once ordered.</li>
          </ul>
          <div className="policy-ribbon">
            <span>Less hustle. More clarity.</span>
          </div>
        </div>
        <span className="policy-bubble bubble-a" aria-hidden="true" />
        <span className="policy-bubble bubble-b" aria-hidden="true" />
        <span className="policy-bubble bubble-c" aria-hidden="true" />
      </section>

      <section className="policy-highlights" aria-labelledby="refund-quick-look">
        <div className="section-header">
          <p className="kicker">Quick look</p>
          <h2 id="refund-quick-look">How refunds work</h2>
        </div>
        <div className="policy-grid">
          <article className="policy-card">
            <p className="policy-card-kicker">Before delivery</p>
            <h3>48-hour grace</h3>
            <p>Full refunds on rentals and supplies within the first 48 hours after payment.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">Closer to your date</p>
            <h3>Fair prep fees</h3>
            <p>Late cancellations keep delivery/setup fees; rentals convert to credits where possible.</p>
          </article>
          <article className="policy-card">
            <p className="policy-card-kicker">After setup</p>
            <h3>Protection rules</h3>
            <p>Damage or missing items may reduce refunds; we’ll document everything with photos.</p>
          </article>
        </div>
      </section>

      <section className="policy-sections" aria-label="Refund policy details">
        {refundSections.map((section) => (
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

      <section className="policy-cta" aria-labelledby="refund-cta-heading">
        <div>
          <p className="kicker">Need help fast?</p>
          <h2 id="refund-cta-heading">Talk to the REEBS team</h2>
          <p className="policy-sub">
            Ask about a cancellation, reschedule an order, or request a refund status update.
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

export default RefundPolicy;
