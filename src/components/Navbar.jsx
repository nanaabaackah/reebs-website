import { React, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCaretDown, faHome, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css'; 
import { useCart } from "./CartContext";

const Navbar = ({ onCartToggle }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { cart } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : 'navbar-default'}`}>
        <div className="main-logo">
          <Link to="/"><img src="/imgs/reebs_logo.svg" alt="REEBS Logo" /></Link>
        </div>
        <div className="nav-links">
          <ul className='menu'>
            <li><Link to="/" className={isActive('/') ? 'active' : ''}><FontAwesomeIcon icon={faHome} /></Link></li>
            <li><Link to="/About" className={isActive('/About') ? 'active' : ''}>About</Link></li>
            <li><Link to="/Shop" className={isActive('/Shop') ? 'active' : ''}>Shop</Link></li>
            <div className='drop'>
              <button className='dropbtn'><Link to="/Rentals" className={isActive('/Rentals') ? 'active' : ''}>Rentals </Link><FontAwesomeIcon icon={faCaretDown} /></button>
              <div className='dropdown-content'>
                <Link to="/Rentals#Kid's%20Party%20Rentals">Kid's Party Equipment</Link>
                <Link to="/Rentals#Party%20Setup%20Rentals">Party Setup Rentals</Link>
                <Link to="/Rentals#Event%20Decor%20&%20Setup">Event Decor</Link>
              </div>
            </div>
            <li><Link to="/Contact" className={isActive('/Contact') ? 'active' : ''}>Contact</Link></li>
          </ul>
        </div>
        <div className='nav-buttons'>
          <Link to="/Book" className={isActive('/Book') ? 'active' : ''}>
            <FontAwesomeIcon icon={faCalendarDays} />
          </Link>
          <button className="cart-button" onClick={onCartToggle}>
            <span className="cart-icon-wrapper">
              <FontAwesomeIcon icon={faShoppingCart} />
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </span>
          </button>
        </div>
      </nav>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled-mob' : 'navbar-default'}`}>
          <div className="nav-links-mob">
            <Link className="logo" to="/"><img src="/imgs/reebs_logo.svg" alt="REEBS Logo" /></Link>
            <ul className='menu'>
              <li><Link to="/" className={isActive('/') ? 'active' : ''}><FontAwesomeIcon icon={faHome} /></Link></li>
              <li><Link to="/About" className={isActive('/About') ? 'active' : ''}>About</Link></li>
              <li><Link to="/Shop" className={isActive('/Shop') ? 'active' : ''}>Shop</Link></li>
              <li><Link to="/Rentals" className={isActive('/Rentals') ? 'active' : ''}>Rentals </Link></li>
              <li><Link to="/Contact" className={isActive('/Contact') ? 'active' : ''}>Contact</Link></li>
              <li><Link to="/Book" className={isActive('/Book') ? 'active' : ''}><FontAwesomeIcon icon={ faCalendarDays } /></Link></li>
              <li><Link to="/Cart" className={isActive('/Cart') ? 'active' : ''}><FontAwesomeIcon icon={ faShoppingCart } /></Link></li>
            </ul>
          </div>
        </nav>
    </header>
  );
}

export default Navbar;