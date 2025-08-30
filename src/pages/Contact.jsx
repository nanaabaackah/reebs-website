import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CookieBanner from '/src/components/CookieBanner';
import Map from '/src/components/Map';
import { Link } from 'react-router-dom';
import ContactForm from '/src/components/ContactForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import './master.css';

function Contact() {
    return (
        <div className='r1'>
            <main className="r6-back">
                <section id='r6-map'>
                    <Map />
                </section>
                <section id='r6-intro'>
                    <div className='r6-contact'>
                        <div className="r6 back-heading">
                            <h1>Contact Us</h1>
                            <p>
                                Let’s bring your party vision to life! Reach out to us for bookings,
                                questions, or custom themes.
                            </p>
                        </div>
                        <div className='r6-details'>
                            <Link to="https://maps.app.goo.gl/ykfi2iVEBfEneTx16" target="_blank"><FontAwesomeIcon icon={faLocationDot} /> Sakumono Broadway, Tema, Ghana</Link><br />
                            <Link to="" target="_blank"><FontAwesomeIcon icon={faPhone} /> +233 24 423 8419</Link>
                            <p>Open Monday to Saturday | 8:30am - 7pm <br /> <em>Please note: We alternate our Monday hours. Call to confirm we are open before visiting us! <br />Holiday Hours may vary</em></p>
                        </div>
                        <div className="r6-social-icons">
                            <Link to="https://www.facebook.com/reebspartythemes" target="_blank"><FontAwesomeIcon icon={faFacebook} /></Link>
                            <Link to="https://www.instagram.com/reebspartythemes_/" target="_blank"><FontAwesomeIcon icon={faInstagram}/></Link>
                            <Link to="https://www.tiktok.com/@reebspartythemes_" target="_blank"><FontAwesomeIcon icon={faTiktok}/></Link>
                            <Link to="" ><FontAwesomeIcon icon={faWhatsapp} /></Link>
                            <Link to="mailto:info@reebspartythemes.com" target="_blank"><FontAwesomeIcon icon={faEnvelope}/></Link>
                        </div>
                    </div>
                    <div id="r6-form">
                        <ContactForm />
                    </div>
                    <img
                        src="/imgs/wave.svg"
                        alt="wave overflow"
                        className="absolute bottom-[-10px] left-1/3 transform -translate-x-1/2 w-[2000px] z-60 pointer-events-none"
                    />
                </section>
            </main>
        </div>
    )
}

export default Contact;