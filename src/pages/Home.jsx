import React from 'react';
//import BrushCanvas from '/src/components/BrushCanvas';
import { Link } from 'react-router-dom';
import './master.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faEnvelope, faHandPointUp, faPhone } from '@fortawesome/free-solid-svg-icons';
import PopupModal from '/src/components/PopupModal';
import TypingEffect from '/src/components/TypingEffect';
import CookieBanner from '/src/components/CookieBanner';
import InstagramFeed from '/src/components/InstagramFeed';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

function Home() {
    return (
        <>
            <CookieBanner />
        <div className="r1">
            {/*<BrushCanvas />*/}
            <PopupModal />
            <main className="r1 back">
                <section id='r1-intro'>
                    <div className="r1 back-heading">
                        <h1>REEBS <br/> Party Themes</h1>
                        <h2 >
                            <TypingEffect text="We promise less hustle, more fun!" speed={120}/>
                        </h2>
                        <div className='r1-back-buttons'>
                            <Link to="/rentals"><button>View Rentals</button></Link>
                            <Link to="/shop"><button>Explore Our Shop</button></Link>
                            <Link to="/contact"><button>Contact Us</button></Link>
                        </div>
                        <a href="#r1-info" className='scroll-down'><FontAwesomeIcon icon={faChevronDown} /></a>
                    </div>
                </section>
                <section id='r1-info'>
                    <h2 className='info-back-heading'>Why Choose Us?</h2>
                    <div className='r1-col-why'>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/easy.png' 
                                alt='Easy Icon' 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Easy Booking</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/delivery.png' 
                                alt='Delivery Icon' 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Reliable Delivery</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/sanitize.png' 
                                alt='Sanitize Icon' 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Sanitized Rentals</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/budget.png' 
                                alt='Easy Icon' 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Budget Flexibility</h3>
                        </div>
                        <div className='col-reason'>
                            <img 
                                src='/imgs/icons/support.png' 
                                alt='Support Icon' 
                                className='col-reason-icon'
                            />
                            <h3 className="name-mid">Fast Support</h3>
                        </div>
                    </div>
                </section>
                <section id="r1-cta" className='cta1'>
                    <div className='cta-heading'>
                        <h1>Have any Questions?</h1>
                        <h2>Contact Us Today!</h2>
                    </div>
                    <div className='cta-buttons'>
                        <Link to="tel:+233-244-238-419" className='btn'><FontAwesomeIcon icon={faPhone} /></Link>
                        <Link to="" className='btn'><FontAwesomeIcon icon={faWhatsapp} /></Link>
                        <Link to="mailto:info@reebspartythemes.com" className='btn'><FontAwesomeIcon icon={faEnvelope} /></Link>
                    </div>
                    <img
                        src="/imgs/confetti2.svg"
                        alt="cloud overflow"
                        className="absolute top-[700px] left-1/2 transform -translate-x-1/2 w-[1200px] z-60 pointer-events-none"
                    />
                </section>
                <section id='r1-services' className="relative overflow-visible">
                    <h2 className='info-back-heading'>Our Services</h2>
                    <div className='r1-back-card'>
                        <div className='serv'>
                            <Link to="">
                                <div className='service' >
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/bouncer.png' 
                                            alt='Bouncy Castle Icon' 
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
                            <Link to="">
                                <div className='service' >
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/supplies.png' 
                                            alt='Party Supplies Icon' 
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
                            <Link to="">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/decor.png' 
                                            alt='Event Decor Icon' 
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
                            <Link to="">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/setup.png' 
                                            alt='Equipment Icon' 
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
                            <Link to="">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/icons/vendor.png' 
                                            alt='Network Icon' 
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
                            <Link to="">
                                <div className='service'>
                                    <div className='desc' >
                                        <img 
                                            src='/imgs/setup2.png' 
                                            alt='Help Icon' 
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
                </section>
                <section id="r1-cta" className='cta2'>
                    <div className='cta-heading' >
                        <h1>Need Help Planning Your Kids' Party?</h1>
                        <h2>Contact Us Today!</h2>
                    </div>
                    <div className='cta-buttons'>
                        <Link to="tel:+233-244-238-419" className='btn'><FontAwesomeIcon icon={faPhone} /></Link>
                        <Link to="" className='btn'><FontAwesomeIcon icon={faWhatsapp} /></Link>
                        <Link to="mailto:info@reebspartythemes.com" className='btn'><FontAwesomeIcon icon={faEnvelope} /></Link>
                    </div>
                </section>
                <section id='r1-social' className="relative h-screen overflow-visible">
                    <InstagramFeed />
                    <img
                        src="/imgs/confetti.svg"
                        alt="cloud overflow"
                        className="absolute bottom-[-50px] left-2/5 transform -translate-x-1/2 w-[1300px] z-60 pointer-events-none"
                    />
                    <a href="#r1-intro" className='scroll-up'><FontAwesomeIcon icon={faHandPointUp} /></a>
                </section>
            </main>
        </div>
        </>
    )
}

export default Home;