# REEBS Frontend Redesign - Implementation Guide

## 🎯 Quick Start (5 Minutes)

### Step 1: Copy Files to Project

```bash
# From your project root directory
cd /path/to/reebs-website

# Copy the redesigned index.css
cp redesign/index.css src/index.css

# Copy the redesigned Navbar.css
cp redesign/Navbar.css src/components/Navbar.css

# Copy the enhancements JavaScript
cp redesign/enhancements.js src/utils/enhancements.js

# Copy Home page styles (create new file or merge)
cp redesign/Home.css src/pages/Home.css
```

### Step 2: Update Main Entry Point

Edit `src/main.jsx` to import the enhancements:

```javascript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { patchOrganizationFetch } from "./utils/organization.js";
import "./utils/enhancements.js"; // ADD THIS LINE

patchOrganizationFetch();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Step 3: Update Home Page Component

Replace or update `src/pages/Home.jsx` with the new structure (see full example below).

### Step 4: Test

```bash
npm run dev
```

Visit `http://localhost:5173` and scroll the page to see:
- Dynamic gradient background shifting
- Bee decorations floating
- Smooth animations on cards
- Navbar behavior changes

## 📋 Detailed Integration Steps

### 1. CSS Variables Setup

The new design system uses CSS variables defined in `index.css`. These will automatically override your existing styles. The key variables are:

```css
:root {
  /* Brand Colors */
  --primary-purple: #7c3aed;
  --primary-orange: #ea580c;
  --primary-green: #22c55e;
  --primary-yellow: #f9f546;
  
  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  
  /* Animation */
  --transition-fast: 150ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;
}
```

### 2. Home Page Update

Here's the complete updated Home.jsx component:

```jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // New styles
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faPhone, 
  faRocket,
  faBolt,
  faHeart,
  faShieldHeart
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import CookieBanner from '../components/CookieBanner';
import { fetchInventoryWithCache, splitInventory } from '../utils/inventoryCache';

function Home() {
  const [suggestedRentals, setSuggestedRentals] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        const { items } = await fetchInventoryWithCache({ signal: controller.signal });
        if (!isMounted) return;
        
        const { rentals, products } = splitInventory(items);
        setSuggestedRentals(rentals.slice(0, 3));
        setSuggestedProducts(products.slice(0, 3));
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Error loading data:", err);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <CookieBanner />
      
      <div className="home" id="main">
        {/* HERO SECTION */}
        <section className="home-hero">
          <div className="hero-video-container">
            <video 
              className="hero-video" 
              src="/imgs/moving/background18.mp4"
              autoPlay 
              loop 
              muted 
              playsInline
              poster="/imgs/background28.svg"
            />
          </div>
          
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-icon">🎉</span>
              <span>Ghana's #1 Party Rental Service</span>
            </div>
            
            <h1 className="hero-title">
              <span className="hero-title-gradient">
                Unforgettable Parties
              </span>
              <br />Start Here
            </h1>
            
            <p className="hero-subtitle">
              From bouncy castles to complete party styling, we make celebrations 
              magical with professional rentals and expert setup across Accra.
            </p>
            
            <div className="hero-cta">
              <Link to="/Rentals" className="btn btn-primary btn-lg">
                Browse Rentals
              </Link>
              <Link to="/Contact" className="btn btn-outline btn-lg">
                Get a Quote
              </Link>
            </div>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">500+</span>
                <span className="hero-stat-label">Rental Items</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">2k+</span>
                <span className="hero-stat-label">Happy Parties</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">24/7</span>
                <span className="hero-stat-label">Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="home-features">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">Why Choose REEBS</span>
              <h2 className="section-title">Everything You Need for Amazing Parties</h2>
              <p className="section-description">
                Professional service, quality equipment, and attention to detail 
                that makes every celebration special.
              </p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <h3 className="feature-title">Fast Setup</h3>
                <p className="feature-description">
                  Our expert team delivers and sets up everything on time, 
                  so you can focus on enjoying your party.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faBolt} />
                </div>
                <h3 className="feature-title">Quality Equipment</h3>
                <p className="feature-description">
                  Premium, well-maintained rentals that are cleaned and 
                  inspected before every event.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faHeart} />
                </div>
                <h3 className="feature-title">Custom Packages</h3>
                <p className="feature-description">
                  Tailored party solutions that match your theme, budget, 
                  and guest count perfectly.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faShieldHeart} />
                </div>
                <h3 className="feature-title">Safety First</h3>
                <p className="feature-description">
                  Kid-safe equipment with proper insurance and trained 
                  staff for peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className="home-services">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">What We Offer</span>
              <h2 className="section-title">Our Services</h2>
              <p className="section-description">
                From equipment rentals to full party styling, we've got you covered.
              </p>
            </div>
            
            <div className="services-grid">
              <div className="service-card">
                <img 
                  src="/imgs/service-rentals.jpg" 
                  alt="Party equipment rentals" 
                  className="service-image"
                  loading="lazy"
                />
                <div className="service-content">
                  <h3 className="service-title">Party Equipment Rentals</h3>
                  <p className="service-description">
                    Bouncy castles, tables, chairs, tents, and entertainment 
                    equipment for any event size.
                  </p>
                  <Link to="/Rentals" className="service-link">
                    View Rentals <span>→</span>
                  </Link>
                </div>
              </div>
              
              <div className="service-card">
                <img 
                  src="/imgs/service-styling.jpg" 
                  alt="Full party styling service" 
                  className="service-image"
                  loading="lazy"
                />
                <div className="service-content">
                  <h3 className="service-title">Full Party Styling</h3>
                  <p className="service-description">
                    Complete decoration packages with balloons, backdrops, 
                    centerpieces, and themed setups.
                  </p>
                  <Link to="/Contact" className="service-link">
                    Get a Quote <span>→</span>
                  </Link>
                </div>
              </div>
              
              <div className="service-card">
                <img 
                  src="/imgs/service-shop.jpg" 
                  alt="Party supplies shop" 
                  className="service-image"
                  loading="lazy"
                />
                <div className="service-content">
                  <h3 className="service-title">Party Supply Shop</h3>
                  <p className="service-description">
                    Buy decorations, party favors, balloons, and supplies 
                    for DIY party planning.
                  </p>
                  <Link to="/Shop" className="service-link">
                    Browse Shop <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED RENTALS */}
        {suggestedRentals.length > 0 && (
          <section className="home-featured">
            <div className="container">
              <div className="section-header">
                <span className="section-kicker">Popular Choices</span>
                <h2 className="section-title">Featured Rentals</h2>
                <p className="section-description">
                  Check out our most popular party rental items.
                </p>
              </div>
              
              <div className="featured-grid">
                {suggestedRentals.map((rental) => (
                  <Link 
                    key={rental.id} 
                    to={`/Rentals/${rental.slug || rental.id}`}
                    className="rental-card"
                  >
                    <div className="rental-image-container">
                      <img 
                        src={rental.image || rental.imageUrl || '/imgs/placeholder.png'} 
                        alt={rental.name}
                        className="rental-image"
                        loading="lazy"
                      />
                      <span className="rental-tag">
                        {rental.specificCategory || rental.category}
                      </span>
                    </div>
                    <div className="rental-content">
                      <h3 className="rental-title">{rental.name}</h3>
                      <p className="rental-description">
                        {rental.description || 'Professional rental item available for your event.'}
                      </p>
                      <div className="rental-price">
                        <div>
                          <span className="rental-price-value">
                            GHS {rental.price || rental.dailyRate}
                          </span>
                          <span className="rental-price-label">/ day</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA SECTION */}
        <section className="home-cta">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Plan Your Party?</h2>
            <p className="cta-description">
              Get in touch with the REEBS team today. We'll help you create 
              an unforgettable celebration that your guests will talk about for years!
            </p>
            <div className="cta-actions">
              <a href="tel:+233244238419" className="cta-chip">
                <FontAwesomeIcon icon={faPhone} />
                <span>Call Us</span>
              </a>
              <a 
                href="https://wa.me/233244238419" 
                className="cta-chip"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faWhatsapp} />
                <span>WhatsApp</span>
              </a>
              <a href="mailto:info@reebspartythemes.com" className="cta-chip">
                <FontAwesomeIcon icon={faEnvelope} />
                <span>Email</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Home;
```

### 3. Navbar Component Update

Your existing Navbar component should work with the new CSS. Just ensure it has these key classes:

```jsx
// In your Navbar.jsx
<nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
  <div className="navbar-container">
    <Link to="/" className="navbar-logo">
      <img src="/imgs/reebs_logo.svg" alt="REEBS" />
    </Link>
    
    <ul className="nav-menu">
      <li><Link to="/" className="nav-link">Home</Link></li>
      <li><Link to="/About" className="nav-link">About</Link></li>
      {/* ... more links */}
    </ul>
    
    <div className="nav-actions">
      <button className="nav-icon-btn search-toggle">
        <FontAwesomeIcon icon={faSearch} />
      </button>
      {/* ... more action buttons */}
    </div>
  </div>
</nav>
```

### 4. Add Bee Decorations to Layout

The JavaScript automatically adds bee decorations, but you can also add them manually in your App.jsx or layout component:

```jsx
<div className="bee-decoration bee-decoration--1"></div>
<div className="bee-decoration bee-decoration--2"></div>
```

### 5. Image Optimization

Update image tags for lazy loading:

```jsx
// Before
<img src="/imgs/large-image.jpg" alt="Description" />

// After
<img 
  data-src="/imgs/large-image.jpg" 
  alt="Description" 
  loading="lazy"
  className="lazy-load"
/>
```

## ⚙️ Configuration Options

### Adjust Gradient Speed

In `index.css`, change the gradient background size:

```css
body::before {
  /* Slower gradient change */
  background-size: 100% 400vh;
  
  /* Faster gradient change */
  background-size: 100% 200vh;
}
```

### Disable Animations for Testing

Add this to your CSS:

```css
/* Disable all animations temporarily */
*, *::before, *::after {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

### Customize Colors

Update the CSS variables in `:root`:

```css
:root {
  /* Change primary purple to a different shade */
  --primary-purple: #8b5cf6;
  
  /* Adjust spacing */
  --space-lg: 2.5rem;
}
```

## 🧪 Testing Your Implementation

### 1. Visual Check
- [ ] Hero section displays correctly
- [ ] Gradient background is visible
- [ ] Bee decorations appear and animate
- [ ] Cards have hover effects
- [ ] Navbar changes on scroll

### 2. Performance Check
```bash
# Run Lighthouse audit
npm run build
npm run preview
# Open in browser and run Lighthouse
```

### 3. Responsive Check
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)

### 4. Accessibility Check
- [ ] Tab through navigation
- [ ] Test with screen reader
- [ ] Check color contrast
- [ ] Test reduced motion preference

## 🐛 Common Issues & Solutions

### Issue: Gradient not animating
**Solution**: Check that JavaScript is loaded and browser supports fixed backgrounds.

```javascript
// Add to console to test
console.log('Gradient initialized:', 
  document.querySelector('.gradient-bg') !== null
);
```

### Issue: Fonts not loading
**Solution**: Add to `index.html`:

```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
```

### Issue: Styles not applying
**Solution**: Clear cache and rebuild:

```bash
rm -rf node_modules/.vite
npm run dev
```

### Issue: Bee SVGs not showing
**Solution**: Verify file paths:

```bash
ls -la public/imgs/bees*.svg
# Should show: bees1.svg, bees4.svg, bees6.svg
```

## 📱 Mobile-Specific Tweaks

For the best mobile experience, add these meta tags to `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<meta name="theme-color" content="#7c3aed">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## 🚀 Going Live

### Pre-deployment Checklist
- [ ] All images optimized
- [ ] Build process completes without errors
- [ ] Lighthouse scores meet targets
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Accessibility audit passed

### Build and Deploy
```bash
# Build for production
npm run build

# Test the build locally
npm run preview

# Deploy (adjust for your hosting)
netlify deploy --prod
```

## 📞 Need Help?

If you encounter issues:
1. Check the console for JavaScript errors
2. Verify all files are in correct locations
3. Clear browser cache
4. Test in incognito/private mode
5. Check browser developer tools for CSS issues

## 🎉 You're Done!

Your REEBS website now has:
- ✨ Beautiful, modern design
- 🎨 Dynamic gradient backgrounds
- 🐝 Playful bee animations
- ⚡ Optimized performance
- 📱 Perfect mobile experience
- ♿ Great accessibility

Enjoy your new website!
