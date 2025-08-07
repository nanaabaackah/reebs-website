import { React, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCaretDown, faHome, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css'; 

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

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
        <div className="nav-links">
            <Link className="logo" to="/"><img src="/imgs/reebs_logo.svg" alt="REEBS Logo" /></Link>
            <ul className='menu'>
              <li><Link to="/" className={isActive('/') ? 'active' : ''}><FontAwesomeIcon icon={faHome} /></Link></li>
              <li><Link to="/About" className={isActive('/About') ? 'active' : ''}>About</Link></li>
              <li><Link to="/Shop" className={isActive('/Shop') ? 'active' : ''}>Shop</Link></li>
              <div className='drop'>
                <button className='dropbtn'><Link to="/Rentals" className={isActive('/Rentals') ? 'active' : ''}>Rentals </Link><FontAwesomeIcon icon={faCaretDown} /></button>
                <div className='dropdown-content'>
                  <Link to=""></Link>
                  <Link to=""></Link>
                  <Link to=""></Link>
                </div>
              </div>
              <li><Link to="/Gallery" className={isActive('/Gallery') ? 'active' : ''}>Gallery</Link></li>
              <li><Link to="/Contact" className={isActive('/Contact') ? 'active' : ''}>Contact</Link></li>
              <li><Link to="/Book" className={isActive('/Book') ? 'active' : ''}><FontAwesomeIcon icon={ faCalendarDays } /></Link></li>
              <li><Link to="/Cart" className={isActive('/Cart') ? 'active' : ''}><FontAwesomeIcon icon={ faShoppingCart } /></Link></li>
            </ul>
        </div>
      </nav>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled-mob' : 'navbar-default'}`}>
          <div className="nav-links-mob">
            <Link className="logo" to="/"><img src="/imgs/reebs_logo.svg" alt="REEBS Logo" /></Link>
            <ul className='menu'>
              <li><Link to="/" className={isActive('/') ? 'active' : ''}><FontAwesomeIcon icon={faHome} /></Link></li>
              <li><Link to="/About" className={isActive('/About') ? 'active' : ''}>About</Link></li>
              <li><Link to="/Shop" className={isActive('/Shop') ? 'active' : ''}>Shop</Link></li>
              <div className='drop'>
                <button className='dropbtn'><Link to="/Rentals" className={isActive('/Rentals') ? 'active' : ''}>Rentals <FontAwesomeIcon icon={faCaretDown} /></Link></button>
                <div className='dropdown-content'>
                  <Link to=""></Link>
                  <Link to=""></Link>
                  <Link to=""></Link>
                </div>
              </div>
              <li><Link to="/Gallery" className={isActive('/Gallery') ? 'active' : ''}>Gallery</Link></li>
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