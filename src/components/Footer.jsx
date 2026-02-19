import React from 'react';
import { Link } from 'react-router-dom';
import '/src/styles/components/Footer.css'; 
import { Call, Location, Sms } from 'iconsax-react';
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTiktok,
  IoLogoWhatsapp,
  IoMail,
  IoSearch,
} from 'react-icons/io5';

function Footer() {
  return (
    <>
      <footer className="site-footer" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Site footer</h2>
        
        <Link className="f-logo" to="/">
          <img
            src="/imgs/reebs_logo2.svg"
            alt="REEBS Logo"
            width="176"
            height="96"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className="f-search-wrapper" role="search">
          <IoSearch className="f-search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search page titles..."
            aria-label="Search site pages"
            className="f-search-input"
          />
        </div>
        <div className='f-info'>
          <div id='links'>
            <Link to="/Contact">Contact & Shop Info</Link>
            <Link to="/refund-policy">Refund Policy</Link>
            <Link to="/delivery-policy">Delivery Policy</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
          <div id='contact'>
            <a href="https://maps.app.goo.gl/ykfi2iVEBfEneTx16" target="_blank" rel="noreferrer">
              <Location size="18" variant="Linear" /> Sakumono Broadway, Tema, Ghana
            </a>
            <a href="tel:+233244238419">
              <Call size="18" variant="Linear" /> +233 24 423 8419
            </a>
            <a href="mailto:info@reebspartythemes.com">
              <Sms size="18" variant="Linear" /> info@reebspartythemes.com
            </a>
            <p>Open Monday to Saturday | 8:30am - 7pm <br /> <em>Holiday hours may vary</em></p>
          </div>
          <div className="f-social-icons">
            <a href="https://www.facebook.com/reebspartythemes" target="_blank" rel="noreferrer" aria-label="REEBS on Facebook">
              <IoLogoFacebook />
            </a>
            <a href="https://www.instagram.com/reebspartythemes_/" target="_blank" rel="noreferrer" aria-label="REEBS on Instagram">
              <IoLogoInstagram />
            </a>
            <a href="https://www.tiktok.com/@reebspartythemes_" target="_blank" rel="noreferrer" aria-label="REEBS on TikTok">
              <IoLogoTiktok />
            </a>
            <a href="https://wa.me/233244238419" target="_blank" rel="noopener noreferrer" aria-label="Chat with REEBS on WhatsApp">
              <IoLogoWhatsapp />
            </a>
            <a href="mailto:info@reebspartythemes.com" target="_blank" rel="noreferrer" aria-label="Email REEBS">
              <IoMail />
            </a>
          </div>
        </div>
        <div className="f-dropdown">
          <nav className='f-navbar'>
            <div className="f-nav-links">
              <ul className='f-menu'>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/shop">Shop</Link></li>
                <li><Link to="/rentals">Rentals</Link></li>
                <li><Link to="/gallery">Gallery</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
          </nav>
        </div>
        <span>&copy; 2026 | REEBS Party Themes | MADE TO MATTER. MADE BY NANA.</span>
      </footer>
    </>
  );
}

export default Footer;
