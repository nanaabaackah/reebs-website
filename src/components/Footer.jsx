import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faTiktok, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

import './Footer.css'; 
import { faEnvelope, faLocationDot, faPhone, faSearch } from '@fortawesome/free-solid-svg-icons';

function Footer() {
  return (
    <>
      <footer className="site-footer"> 
        
        <Link className="f-logo" to="/"><img src="/imgs/reebs_logo2.svg" alt="REEBS Logo" /></Link>
        <div className="f-search-wrapper" role="search">
          <FontAwesomeIcon icon={faSearch} className="f-search-icon" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search site"
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
            <Link to="https://maps.app.goo.gl/ykfi2iVEBfEneTx16" target="_blank"><FontAwesomeIcon icon={faLocationDot} /> Sakumono Broadway, Tema, Ghana</Link>
            <Link to="tel:+233244238419"><FontAwesomeIcon icon={faPhone} /> +233 24 423 8419</Link>
            <p to="" target="_blank">Open Monday to Saturday | 8:30am - 7pm <br /> <em>Holiday Hours may vary</em></p>
          </div>
          <div className="f-social-icons">
            <Link to="https://www.facebook.com/reebspartythemes" target="_blank"><FontAwesomeIcon icon={faFacebook} /></Link>
            <Link to="https://www.instagram.com/reebspartythemes_/" target="_blank"><FontAwesomeIcon icon={faInstagram}/></Link>
            <Link to="https://www.tiktok.com/@reebspartythemes_" target="_blank"><FontAwesomeIcon icon={faTiktok}/></Link>
            <Link to="https://wa.me/233244238419" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faWhatsapp} /></Link>
            <Link to="mailto:info@reebspartythemes.com" target="_blank"><FontAwesomeIcon icon={faEnvelope}/></Link>
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
        <span>&copy; 2025 | REEBS Party Themes | MADE TO MATTER. MADE BY NANA.</span>
      </footer>
    </>
  );
}

export default Footer;
