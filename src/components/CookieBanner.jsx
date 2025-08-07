import CookieConsent from 'react-cookie-consent';
import '/src/pages/master.css';

const CookieBanner = () => {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Reject"
      enableDeclineButton
      cookieName="reebsCookieConsent"
      containerClasses="cookie-banner"
      contentClasses="cookie-content"
      buttonClasses="cookie-accept"
      declineButtonClasses="cookie-decline"
      expires={150}
      onAccept={() => {
        window.gtag && window.gtag('consent', 'update', {
          ad_storage: 'granted',
          analytics_storage: 'granted',
        });
      }}
      onDecline={() => {
        window.gtag && window.gtag('consent', 'update', {
          ad_storage: 'denied',
          analytics_storage: 'denied',
        });
      }}
    >
      We use cookies to improve your experience, analyze traffic, and show personalized content.{" "}
      <a href="/privacy-policy" className="cookie-link">Learn more</a>
    </CookieConsent>
  );
};

export default CookieBanner;
