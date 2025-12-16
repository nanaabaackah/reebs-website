import { useEffect, useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import '/src/pages/master.css';

const CookieBanner = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem('reebsCookiePrefs');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setAnalyticsAllowed(Boolean(parsed.analytics));
        setMarketingAllowed(Boolean(parsed.marketing));
      }
    } catch (err) {
      console.warn('Unable to read cookie preferences', err);
    }
  }, []);

  const persistPreferences = (prefs) => {
    try {
      localStorage.setItem('reebsCookiePrefs', JSON.stringify(prefs));
    } catch (err) {
      console.warn('Unable to store cookie preferences', err);
    }

    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
      });
    }
  };

  const handleSave = () => {
    persistPreferences({
      necessary: true,
      analytics: analyticsAllowed,
      marketing: marketingAllowed,
    });
  };

  const handleDecline = () => {
    setAnalyticsAllowed(false);
    setMarketingAllowed(false);
    persistPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  return (
    <CookieConsent
      location="bottom"
      buttonText="Save & continue"
      declineButtonText="Reject all"
      enableDeclineButton
      cookieName="reebsCookieConsent"
      containerClasses={`cookie-banner ${isExpanded ? 'is-expanded' : ''}`}
      contentClasses="cookie-content"
      buttonClasses="cookie-accept"
      declineButtonClasses="cookie-decline"
      buttonWrapperClasses="cookie-actions"
      expires={150}
      disableStyles
      extraCookieOptions={{ sameSite: 'lax', path: '/' }}
      onAccept={handleSave}
      onDecline={handleDecline}
    >
      <div className="cookie-shell" role="region" aria-label="Cookie preferences">
        <div className="cookie-copy">
          <p className="cookie-pill">Cookies</p>
          <h3 className="cookie-title">Make yourself at home</h3>
          <p className="cookie-sub">
            We use cookies to keep the site speedy, learn what sparks joy, and share the right party inspo.
          </p>
          <div className="cookie-links">
            <button
              type="button"
              className="cookie-link-btn"
              onClick={() => setIsExpanded((open) => !open)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Hide cookie settings' : 'Cookie settings'}
            </button>
            <a href="/privacy-policy" className="cookie-link">Privacy policy</a>
          </div>
        </div>

        <div className={`cookie-preferences ${isExpanded ? 'is-open' : ''}`}>
          <div className="cookie-preference-card is-locked">
            <div>
              <p>Essential</p>
              <small>Needed for checkout, cart, and keeping your session safe.</small>
            </div>
            <span className="cookie-chip">Always on</span>
          </div>

          <div className="cookie-preference-card">
            <div>
              <p>Analytics</p>
              <small>Helps us see what pages party lovers enjoy most so we can improve.</small>
            </div>
            <label className="cookie-switch">
              <input
                type="checkbox"
                checked={analyticsAllowed}
                onChange={(event) => setAnalyticsAllowed(event.target.checked)}
                aria-label="Toggle analytics cookies"
              />
              <span className="cookie-switch-slider" aria-hidden="true" />
            </label>
          </div>

          <div className="cookie-preference-card">
            <div>
              <p>Marketing</p>
              <small>Lets us share new rentals, promos, and inspo that match your vibe.</small>
            </div>
            <label className="cookie-switch">
              <input
                type="checkbox"
                checked={marketingAllowed}
                onChange={(event) => setMarketingAllowed(event.target.checked)}
                aria-label="Toggle marketing cookies"
              />
              <span className="cookie-switch-slider" aria-hidden="true" />
            </label>
          </div>

          <p className="cookie-note">
            Your preferences are saved for 5 months. You can adjust them now or clear cookies later to review again.
          </p>
        </div>
      </div>
    </CookieConsent>
  );
};

export default CookieBanner;
