import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '/src/styles/components/Navbar.css';
import { useAuth } from "./AuthContext";

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Rentals', path: '/Rentals' },
  { label: 'Shop', path: '/Shop' },
  { label: 'Gallery', path: '/Gallery' },
  { label: 'Contact', path: '/Contact' }
];

const isPathActive = (pathname, path) => {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
};

const Navbar = ({ scrollContainerRef }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, authReady } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId = null;
    const scrollHost = scrollContainerRef?.current || window;
    const usingWindow = scrollHost === window;

    const getScrollTop = () =>
      usingWindow ? window.scrollY || window.pageYOffset || 0 : scrollHost.scrollTop;

    const handleScroll = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const next = getScrollTop() > 42;
        setScrolled((prev) => (prev === next ? prev : next));
      });
    };

    handleScroll();
    scrollHost.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId != null) window.cancelAnimationFrame(rafId);
      scrollHost.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, scrollContainerRef]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login', { replace: true, state: { signedOut: true } });
  };

  const authPath = authReady && user ? '/admin' : '/login';
  const authLabel = authReady && user ? 'Dashboard' : 'Sign in';

  const handleHeaderWheel = (event) => {
    const scrollHost = scrollContainerRef?.current;
    if (!scrollHost) return;
    if (event.defaultPrevented) return;
    if (event.deltaY === 0 && event.deltaX === 0) return;

    scrollHost.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: 'auto',
    });
    event.preventDefault();
  };

  const renderLinks = (onClick) => (
    <ul className="navbar-links" role="list">
      {NAV_LINKS.map((item) => (
        <li key={item.path}>
          <Link
            to={item.path}
            className={isPathActive(location.pathname, item.path) ? 'is-active' : ''}
            aria-current={isPathActive(location.pathname, item.path) ? 'page' : undefined}
            onClick={onClick}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <header className="site-header" onWheel={handleHeaderWheel}>
      <div className="navbar-top-rail" aria-hidden="true" />
      <nav className={`navbar navbar-desktop ${scrolled ? 'is-scrolled' : ''}`} aria-label="Main navigation">
        <div className="navbar-corner navbar-corner-left" aria-hidden="true">
          <svg viewBox="0 0 44 44" focusable="false" role="presentation">
            <path d="M0 0H44V44C34.7 -16 0 24.3 0 0Z" />
          </svg>
        </div>
        <div className="navbar-corner navbar-corner-right" aria-hidden="true">
          <svg viewBox="0 0 44 44" focusable="false" role="presentation">
            <path d="M0 0H44V44C34.7 -16 0 24.3 0 0Z" />
          </svg>
        </div>

        <div className="navbar-col navbar-col-links">
          {renderLinks()}
        </div>

        <div className="navbar-col navbar-col-logo">
          <Link to="/" className="navbar-logo-link" aria-label="REEBS home">
            <img
              src="/imgs/reebs_logo.svg"
              alt="REEBS"
              width="174"
              height="58"
              decoding="async"
            />
          </Link>
        </div>

        <div className="navbar-col navbar-col-actions">
          <Link to={authPath} className="navbar-signin">
            {authLabel}
          </Link>
          {authReady && user ? (
            <button type="button" className="navbar-signout" onClick={handleLogout}>
              Sign out
            </button>
          ) : null}
          <Link to="/Contact" className="navbar-demo-btn">
            <span>See a demo</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>

      <nav className={`navbar navbar-mobile ${mobileOpen ? 'is-open' : ''}`} aria-label="Mobile navigation">
        <div className="navbar-mobile-top">
          <Link to="/" className="navbar-logo-link" aria-label="REEBS home">
            <img
              src="/imgs/reebs_logo.svg"
              alt="REEBS"
              width="164"
              height="54"
              decoding="async"
            />
          </Link>
          <button
            type="button"
            className="navbar-mobile-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`navbar-mobile-panel ${mobileOpen ? 'is-open' : ''}`}>
          {renderLinks(() => setMobileOpen(false))}
          <div className="navbar-mobile-actions">
            <Link to={authPath} className="navbar-signin" onClick={() => setMobileOpen(false)}>
              {authLabel}
            </Link>
            {authReady && user ? (
              <button type="button" className="navbar-signout" onClick={handleLogout}>
                Sign out
              </button>
            ) : null}
            <Link to="/Contact" className="navbar-demo-btn" onClick={() => setMobileOpen(false)}>
              <span>See a demo</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
