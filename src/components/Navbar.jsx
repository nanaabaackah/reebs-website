import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCaretDown, faHome, faShoppingCart, faMoon, faSun, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css'; 
import { useCart } from "./CartContext";

const Navbar = ({ onCartToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('reebs-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [hasUserThemePreference, setHasUserThemePreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('reebs-theme'));
  });
  const { cart } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const searchIndex = [
    { title: 'Home', path: '/', tags: 'hero rentals shop contact' },
    { title: 'About', path: '/About', tags: 'team mission values' },
    { title: 'Shop', path: '/Shop', tags: 'store products decor' },
    { title: 'Rentals', path: '/Rentals', tags: 'equipment party setup' },
    { title: 'Booking', path: '/Book', tags: 'rentals booking reserve delivery' },
    { title: 'Gallery', path: '/Gallery', tags: 'photos themes' },
    { title: 'FAQ', path: '/faq', tags: 'questions answers help' },
    { title: 'Contact', path: '/Contact', tags: 'email phone whatsapp' },
    { title: 'Cart', path: '/Cart', tags: 'bag checkout' },
    { title: 'Privacy Policy', path: '/privacy-policy', tags: 'legal data' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      if (!hasUserThemePreference) {
        setDarkMode(e.matches);
      }
    };
    media.addEventListener('change', handleMediaChange);
    return () => media.removeEventListener('change', handleMediaChange);
  }, [hasUserThemePreference]);

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (hasUserThemePreference) {
      localStorage.setItem('reebs-theme', theme);
    } else {
      localStorage.removeItem('reebs-theme');
    }
  }, [darkMode, hasUserThemePreference]);

  const toggleTheme = () => {
    setHasUserThemePreference(true);
    setDarkMode((prev) => !prev);
  };

  const filteredResults = searchQuery.trim()
    ? searchIndex.filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.tags.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredResults.length > 0) {
      navigate(filteredResults[0].path);
      closeSearchOverlay();
    }
  };

  const openSearchOverlay = () => {
    setShowSearchOverlay(true);
    setShowResults(true);
    setTimeout(() => {
      const input = document.querySelector('.nav-search--overlay input');
      if (input) input.focus();
    }, 0);
  };

  const closeSearchOverlay = () => {
    setShowSearchOverlay(false);
    setShowResults(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && showSearchOverlay) {
        closeSearchOverlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showSearchOverlay]);

  const renderSearch = (variant) => (
    <div className={`nav-search nav-search--${variant}`}>
      <form onSubmit={handleSearchSubmit}>
        <FontAwesomeIcon icon={faSearch} aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => searchQuery && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 120)}
          placeholder="Start Typing"
          aria-label="Search site"
        />
        <button type="submit" aria-label="Submit search">
          Go
        </button>
      </form>
      {showSearchOverlay && showResults && filteredResults.length > 0 && (
        <ul className="nav-search-results" role="listbox">
          {filteredResults.map((item) => (
            <li key={item.path}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                  closeSearchOverlay();
                }}
              >
                <span className="nav-search-title">{item.title}</span>
                <span className="nav-search-tags">{item.tags}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const isActive = (path) => location.pathname === path;
  const desktopClassName = ['navbar', 'navbar-desktop', scrolled ? 'navbar-scrolled' : 'navbar-default'].join(' ').trim();
  const mobileClassName = ['navbar', 'navbar-mobile', scrolled ? 'navbar-scrolled-mob' : 'navbar-default'].join(' ').trim();

  const renderLinks = (isMobile = false, includeLogo = true) => (
    <ul className="menu">
      {!isMobile && includeLogo && scrolled && (
        <li className="main-logo">
          <Link to="/"><img src="/imgs/reebs_logo.svg" alt="REEBS Logo" /></Link>
        </li>
      )}
      <li><Link to="/" className={isActive('/') ? 'active' : ''}><FontAwesomeIcon icon={faHome} /></Link></li>
      <li><Link to="/About" className={isActive('/About') ? 'active' : ''}>About</Link></li>
      <li><Link to="/Shop" className={isActive('/Shop') ? 'active' : ''}>Shop</Link></li>
      <li className="drop">
        <button type="button" className="dropbtn">
          <Link to="/Rentals" className={isActive('/Rentals') ? 'active' : ''}>Rentals </Link>
          <FontAwesomeIcon icon={faCaretDown} />
        </button>
        <div className="dropdown-content">
          <Link to="/Rentals#Kid's%20Party%20Rentals">Kid's Party Equipment</Link>
          <Link to="/Rentals#Party%20Setup%20Rentals">Party Setup Rentals</Link>
          <Link to="/Rentals#Event%20Decor%20&%20Setup">Event Decor</Link>
        </div>
      </li>
      <li><Link to="/Contact" className={isActive('/Contact') ? 'active' : ''}>Contact</Link></li>
    
    </ul>
  );

  return (
    <header>
      <nav className={desktopClassName}>
        <div className="nav-links">
          {renderLinks()}
        </div>
        <div className='nav-buttons'>
          <button
            type="button"
            className="glass-btn icon-btn search-toggle"
            onClick={openSearchOverlay}
            aria-label="Open search"
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <button
            type="button"
            className={`${isActive('/Book') ? 'active' : ''} glass-btn icon-btn cart-button`}
            onClick={() => navigate('/Book')}
            aria-label="Book"
          >
            <FontAwesomeIcon icon={faCalendarDays} />
          </button>
          <button className="cart-button glass-btn icon-btn" onClick={onCartToggle}>
            <span className="cart-icon-wrapper">
              <FontAwesomeIcon icon={faShoppingCart} />
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </span>
          </button>
          <button
            type="button"
            className={`cart-button glass-btn icon-btn theme-toggle ${darkMode ? 'is-dark' : ''}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          </button>
        </div>
      </nav>
      <nav className={mobileClassName}>

        <div className="nav-links-mob">

          {scrolled && (
            <Link className="logo" to="/"><img src="/imgs/reebs_logo.svg" alt="REEBS Logo" /></Link>
          )}
          <div className='nav-links'>
            {renderLinks(true, false)}
          </div>
          <div className='nav-buttons'>
            <button
              type="button"
              className="glass-btn icon-btn search-toggle"
              onClick={openSearchOverlay}
              aria-label="Open search"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
            <button
              type="button"
              className={`${isActive('/Book') ? 'active' : ''} glass-btn icon-btn cart-button`}
              onClick={() => navigate('/Book')}
              aria-label="Book"
            >
              <FontAwesomeIcon icon={faCalendarDays} />
            </button>
            <button className="cart-button glass-btn icon-btn" onClick={onCartToggle}>
              <span className="cart-icon-wrapper">
                <FontAwesomeIcon icon={faShoppingCart} />
                {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
              </span>
            </button>
            <button
              type="button"
              className={`cart-button glass-btn icon-btn theme-toggle ${darkMode ? 'is-dark' : ''}`}
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </button>
          </div>
          
        </div>
      </nav>
      {showSearchOverlay && (
        <div className="nav-search-overlay" role="dialog" aria-modal="true" onClick={closeSearchOverlay}>
          <div className="nav-search-box" onClick={(e) => e.stopPropagation()}>
            <button className="nav-search-close" type="button" aria-label="Close search" onClick={closeSearchOverlay}>
              ×
            </button>
            <p className="nav-search-label">Search the site</p>
            {renderSearch('overlay')}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
