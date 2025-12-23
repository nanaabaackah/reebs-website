import React, { useEffect, useMemo, useRef, useState } from 'react';
import InstagramFeed from '/src/components/InstagramFeed';
import { Link } from 'react-router-dom';
import galleryImages from '/src/data/galleryImages.json';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import './master.css';

function Gallery() {
    const [activeIndex, setActiveIndex] = useState(-1);
    const [rentals, setRentals] = useState([]);
    const [shopItems, setShopItems] = useState([]);
    const rentalShopRef = useRef(null);

    const slides = useMemo(() => (
        galleryImages.map((item) => ({
            src: item.src,
            title: item.title,
            description: item.description,
            alt: item.title
        }))
    ), []);

    const heroPreviews = useMemo(() => galleryImages.slice(0, 4), []);
    const featuredItems = useMemo(() => {
        const rentalMapped = rentals.slice(0, 8).map((item) => ({
            id: `rental-${item.id}`,
            name: item.name,
            tag: item.specificCategory || item.specificcategory || item.category || 'Rental',
            price: item.price ?? (typeof item.priceCents === 'number' ? item.priceCents / 100 : undefined),
            image: item.image || item.imageUrl || '/imgs/placeholder.png',
            href: `/Rentals#${encodeURIComponent(item.specificCategory || item.specificcategory || '')}`,
            type: 'Rental'
        }));

        const shopMapped = shopItems.slice(0, 8).map((item) => ({
            id: `shop-${item.id}`,
            name: item.name,
            tag: item.specificCategory || item.specificcategory || item.type || 'Party shop',
            price: item.price ?? (typeof item.priceCents === 'number' ? item.priceCents / 100 : undefined),
            image: item.image || item.imageUrl || '/imgs/placeholder.png',
            href: '/Shop',
            type: 'Shop'
        }));

        return [...rentalMapped, ...shopMapped];
    }, [rentals, shopItems]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const res = await fetch('/.netlify/functions/inventory');
                if (!res.ok) throw new Error(`Bad response ${res.status}`);

                const data = await res.json();
                const records = Array.isArray(data) ? data : [];
                const rentalsOnly = records.filter((item) => {
                    const source = (item.sourceCategoryCode || item.sourcecategorycode || '').toLowerCase();
                    const isRental = source ? source === 'rental' : (item.sku || '').toString().toUpperCase().startsWith('REN');
                    const active = (item.status ?? item.isActive) !== false;
                    return isRental && active;
                });
                const inventoryOnly = records.filter((item) => {
                    const source = (item.sourceCategoryCode || item.sourcecategorycode || '').toLowerCase();
                    const isInventory = source ? source !== 'rental' : true;
                    const active = (item.status ?? item.isActive) !== false;
                    return isInventory && active;
                });

                if (isMounted) {
                    setRentals(rentalsOnly || []);
                    setShopItems(inventoryOnly || []);
                }
            } catch (err) {
                console.error('Error loading rental/shop items:', err);
            }
        };

        load();
        return () => { isMounted = false; };
    }, []);

    const scrollCarousel = (delta) => {
        if (!rentalShopRef.current) return;
        rentalShopRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    };

    return (
        <div className="gallery-page">
            <main className="gallery-shell">
                <section id="r5-intro" className="gallery-hero">
                    <div className="gallery-hero-beams" aria-hidden="true" />
                    <div className="gallery-hero-grid">
                        <div className="gallery-hero-copy">
                            <p className="gallery-kicker">Recent installs · Party boxes · Rentals</p>
                            <h1>Gallery</h1>
                            <p className="gallery-hero-sub">
                                A peek into the beautiful moments we’ve styled, delivered, and set up across Ghana.
                                Tap to zoom in and see the details up close.
                            </p>
                            <div className="gallery-hero-chips" aria-label="Gallery highlights">
                                <span className="gallery-chip">Balloon magic</span>
                                <span className="gallery-chip">Bouncy castles</span>
                                <span className="gallery-chip">Tablescapes</span>
                                <span className="gallery-chip">Picnic vibes</span>
                            </div>
                            <div className="gallery-hero-stats" aria-label="Gallery highlights">
                                <div>
                                    <strong>2k+</strong>
                                    <span>Parties styled</span>
                                </div>
                                <div>
                                    <strong>Same-day</strong>
                                    <span>Delivery options</span>
                                </div>
                                <div>
                                    <strong>Across GH</strong>
                                    <span>Accra · Kumasi · Cape Coast</span>
                                </div>
                            </div>
                        </div>
                        <div className="gallery-hero-collage" aria-hidden="true">
                            {heroPreviews.map((item, index) => (
                                <div key={index} className={`collage-card collage-card-${index}`}>
                                    <img src={item.src} alt={item.title} loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="r5-gallery" className="gallery-showcase">
                    <div className="gallery-section-header">
                        <div className="section-header">
                            <p className="kicker">Real parties, real smiles</p>
                            <h2>Styled moments worth saving</h2>
                            <p className="gallery-section-sub">
                                From balloon installs to full venue makeovers, here’s a snapshot of the magic.
                                We keep the layouts bright, playful, and practical—just like the new home page vibe.
                            </p>
                        </div>
                        <div className="gallery-hint">Tap any photo to view in full</div>
                    </div>

                    <div className="gallery-grid">
                        {slides.map((item, index) => (
                            <article
                                key={index}
                                className={`gallery-card ${(index + 3) % 7 === 0 ? 'tall' : ''} ${(index + 2) % 5 === 0 ? 'wide' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="gallery-img-btn"
                                    onClick={() => setActiveIndex(index)}
                                    aria-label={`Open ${item.title} in the lightbox`}
                                >
                                    <img
                                        src={item.src}
                                        alt={item.title}
                                        loading="lazy"
                                        className="gallery-img"
                                    />
                                    <div className="gallery-overlay">
                                        <div>
                                            <p className="overlay-kicker">{item.description}</p>
                                            <h3>{item.title}</h3>
                                        </div>
                                        <span className="overlay-pill">View detail</span>
                                    </div>
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="gallery-rent-shop">
                    <div className="gallery-carousel-header">
                        <div>
                            <p className="kicker">Ready to rent or shop</p>
                            <h2>Items featured in this gallery</h2>
                            <p className="gallery-section-sub">
                                Book the bouncy castles, popcorn, décor, and supplies you see here. We deliver, set up, and pack up when you’re done.
                            </p>
                        </div>
                        <div className="carousel-actions">
                            <button type="button" className="carousel-nav" onClick={() => scrollCarousel(-320)} aria-label="Scroll left">
                                ‹
                            </button>
                            <button type="button" className="carousel-nav" onClick={() => scrollCarousel(320)} aria-label="Scroll right">
                                ›
                            </button>
                        </div>
                    </div>
                    <div className="gallery-carousel" ref={rentalShopRef}>
                        {featuredItems.length === 0 && (
                            <div className="carousel-placeholder">Loading rentals and shop picks…</div>
                        )}
                        {featuredItems.map((item) => (
                            <article key={item.id} className="gallery-carousel-card">
                                <div className="carousel-img-wrap">
                                    <img src={item.image} alt={item.name} loading="lazy" />
                                    <span className="carousel-pill">{item.type}</span>
                                </div>
                                <div className="carousel-meta">
                                    <p className="carousel-title">{item.name}</p>
                                    <p className="carousel-tag">{item.tag}</p>
                                    {item.price && (
                                        <p className="carousel-price">GH₵{item.price} {item.type === 'Rental' ? '/ day' : ''}</p>
                                    )}
                                </div>
                                <Link to={item.href} className="carousel-link">
                                    {item.type === 'Rental' ? 'Book this rental' : 'Shop this item'}
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <Lightbox
                open={activeIndex >= 0}
                close={() => setActiveIndex(-1)}
                index={activeIndex}
                slides={slides}
                render={{
                    slide: ({ slide }) => (
                        <div className="gallery-lightbox-slide">
                            <img src={slide.src} alt={slide.alt} className="gallery-lightbox-img" />
                            <div className="gallery-lightbox-meta">
                                <h3>{slide.title}</h3>
                                <p>{slide.description}</p>
                            </div>
                        </div>
                    )
                }}
            />
        </div>
    );
}

export default Gallery;
