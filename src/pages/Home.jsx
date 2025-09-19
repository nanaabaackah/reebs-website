import React from 'react';
//import BrushCanvas from '/src/components/BrushCanvas';
import { Link } from 'react-router-dom';
import './master.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import PopupModal from '/src/components/PopupModal';
import TypingEffect from '/src/components/TypingEffect';
import CookieBanner from '/src/components/CookieBanner';
import InstagramFeed from '/src/components/InstagramFeed';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

function Home() {
    return (
        <>
            <a href="#main" className="skip-link">Skip to main content</a>
            <CookieBanner />
        <div className="r1">
            {/*<BrushCanvas />*/}
            <PopupModal />
            <main className="r1 back" role="main">
                <section id="r1-intro" aria-labelledby="home-hero-heading">
                    <div className="r1 back-heading" >
                        <h1>REEBS <br/> Party Themes</h1>
                        <h2 >
                            <span className="sr-only">We promise less hustle, more fun!</span>
                            <TypingEffect text="We promise less hustle, more fun!" speed={120} aria-hidden />
                        </h2>
                        <div className='r1-back-buttons' aria-label="heading-buttons">
                            <Link className="btn-primary" to="/rentals">View Rentals</Link>
                            <Link className="btn-primary" to="/shop">Explore Our Shop</Link>
                            <Link className="btn-primary" to="/contact">Contact Us</Link>
                        </div>

                        <a href="#r1-info" className='scroll-down' aria-label="Scroll to Why Choose Us"><FontAwesomeIcon icon={faChevronDown} /></a>
                    </div>
                </section>
                <section id='r1-info' aria-labelledby="why-heading">
                    <h2 className='info-back-heading'>Why Choose Us?</h2>
                    <div className='r1-col-why'>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/easy.png' 
                                alt="" role="presentation"
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Easy Booking</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/delivery.png' 
                                alt="" role="presentation" 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Reliable Delivery</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/sanitize.png' 
                                alt="" role="presentation"
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Sanitized Rentals</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/budget.png' 
                                alt="" role="presentation" 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Budget Flexibility</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/support.png' 
                                alt="" role="presentation"
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Fast Support</h3>
                        </div>
                        
                    </div>
                    <a href="#r1-services" className='scroll-down' aria-label="Scroll to services"><FontAwesomeIcon icon={faChevronDown} /></a>
                </section>
                <section id="r1-cta" className='cta1' aria-labelledby="cta1-heading">
                    <div className='cta-heading'>
                        <h2>Have any Questions?</h2>
                        <h3>Contact Us Today!</h3>
                    </div>
                    <div className='cta-buttons'>
                        <a href="tel:+233244238419" className='btn' aria-label="Call REEBS Party Themes">
                            <FontAwesomeIcon icon={faPhone} />
                        </a>
                        <a href="https://wa.me/233244238419" target="_blank" rel="noopener noreferrer"
                            className='btn' aria-label="Chat with us on WhatsApp">
                            <FontAwesomeIcon icon={faWhatsapp} />
                        </a>
                        <a href="mailto:info@reebspartythemes.com" className='btn' aria-label="Email REEBS Party Themes">
                            <FontAwesomeIcon icon={faEnvelope} />
                        </a>
                    </div>
                    <img
                        src="/imgs/confetti2.svg"
                        alt="" aria-hidden="true"
                        className="absolute top-[700px] left-1/2 transform -translate-x-1/2 w-[1200px] z-60 pointer-events-none"
                    />
                </section>
                <section id='r1-services' className="relative overflow-visible" aria-labelledby="services-heading">
                    <h2 className='info-back-heading'>Our Services</h2>
                    <div className='r1-back-card'>
                        <div className='serv'>
                            <Link to="/rentals">
                                <div className='service' >
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/bouncer.png' 
                                            alt="" role="presentation"
                                            className='serv-icon'
                                        />
                                        <p>Party Equipment Rentals</p>
                                    </div>
                                </div>
                            </Link>
                            <div className='listed'>
                                <p>Bouncy castles, popcorn machines, cotton candy, 
                                    tents, tables, chairs, etc. for your events. Available for delivery or pickup.</p>
                            </div>
                        </div>
                        <div className='serv'>
                            <Link to="/shop">
                                <div className='service' >
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/supplies.png' 
                                            alt="" role="presentation" 
                                            className='serv-icon'
                                        />
                                        <p>Party Supplies & Gifts</p>
                                    </div>
                                </div>
                            </Link>
                            <div className='listed'>
                                <p>Shop for birthday decorations, balloons, toys, stationery, and themed gift sets for all ages.</p>
                            </div>
                        </div>
                        <div className='serv'>
                            <Link to="/shop">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/decor.png' 
                                            alt="" role="presentation" 
                                            className='serv-icon'
                                        />
                                        <p>Custom Event Decor</p>
                                    </div>
                                </div>
                            </Link>
                            <div className='listed'>
                                <p>We design and set up stunning balloon arches, table styling, and more.</p>
                            </div>
                        </div>
                        <div className='serv'>
                            <Link to="/rentals">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/setup.png' 
                                            alt="" role="presentation"
                                            className='serv-icon'
                                        />
                                        <p>All-in-One Party Packages</p>
                                    </div>
                                </div>
                            </Link>
                            <div className='listed'>
                                <p>Bundle your event with our curated packages: rental + decor + supplies = hassle-free parties.</p>
                            </div>
                        </div>
                        <div className='serv'>
                            <Link to="/rentals">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/icons/vendor.png' 
                                            alt="" role="presentation" 
                                            className='serv-icon'
                                        />
                                        <p>Extended Vendor Network</p>
                                    </div>
                                </div>
                            </Link>
                            <div className='listed'>
                                <p>Need something extra? We can outsource tents, catering, entertainment, and more via trusted partners.</p>
                            </div>
                        </div>
                        <div className='serv'>
                            <Link to="/contact">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/setup2.png' 
                                            alt="" role="presentation"
                                            className='serv-icon'
                                        />
                                        <p>Party Planning Help</p>
                                    </div>
                                </div>
                            </Link>
                            <div className='listed'>
                                <p>Don’t know where to start? Book a free consultation to plan your celebration step-by-step. </p>
                            </div>
                        </div>
                    </div>
                    <a href="#r1-social" className='scroll-down' aria-label="Scroll to Social"><FontAwesomeIcon icon={faChevronDown} /></a>
                </section>
                <section id="r1-cta-b" className='cta2'>
                    <div className='cta-heading' >
                        <h2>Need Help Planning Your Kids' Party?</h2>
                        <h3>Contact Us Today!</h3>
                    </div>
                    <div className='cta-buttons'>
                        <a href="tel:+233244238419" className='btn' aria-label="Call REEBS Party Themes">
                            <FontAwesomeIcon icon={faPhone} />
                        </a>
                        <a href="https://wa.me/233244238419" target="_blank" rel="noopener noreferrer"
                            className='btn' aria-label="Chat with us on WhatsApp">
                            <FontAwesomeIcon icon={faWhatsapp} />
                        </a>
                        <a href="mailto:info@reebspartythemes.com" className='btn' aria-label="Email REEBS Party Themes">
                            <FontAwesomeIcon icon={faEnvelope} />
                        </a>
                    </div>

                </section>
                <section id='r1-social' className="relative h-screen overflow-visible">
                    <InstagramFeed />
                    
                    <img
                        src="/imgs/confetti.svg"
                        alt="" aria-hidden="true"
                        className="absolute bottom-[-270px] left-2/5 transform -translate-x-1/2 w-[1300px] z-60 pointer-events-none"
                    />
                    <a href="#r1-intro" className='scroll-up' aria-label="Scroll to Top"><FontAwesomeIcon icon={faChevronUp} /></a>
                </section>
            </main>
        </div>
        </>
    )
}

export default Home;