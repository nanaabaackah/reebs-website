import React from 'react';
import CookieBanner from '/src/components/CookieBanner';
import InstagramFeed from '/src/components/InstagramFeed';
import { Link } from 'react-router-dom';

import './master.css';

function About() {
    return (
        <>
            <CookieBanner />
            <div className='r2'>
                <main className="r2 back">
                    <section id='r2-intro'>
                        <div className="r2 back-heading">
                            <h1>About us</h1>
                            <p>
                                REEBS Party Themes is your go-to destination for unforgettable celebrations. 
                                We provide unique party themes, high-quality rentals, and a curated selection of 
                                party supplies to bring your vision to life. From small gatherings to large events, 
                                we ensure every detail is taken care of so you can enjoy the moment.
                            </p>
                        </div>
                        <div className='r2-back-image'>
                            <img src='/imgs/r4_b.png'/>
                        </div>
                        <img
                            src="/imgs/bees2.svg"
                            alt="cloud overflow"
                            className="absolute bottom-[-400px] left-1/2 transform -translate-x-1/2 w-100px] z-60 pointer-events-none"
                        />
                    </section>
                    <section id='r2-mto' className="relative overflow-visible" >
                        <div className='r2-back-image'>
                            <img src='/imgs/owner.png'/>
                        </div>
                        <div className='r2-mto-back-heading'>
                            <h2>Meet the Owner</h2>
                            <p>
                            Our founder, <strong>Sabina Ackah</strong>, brings a wealth of creativity and 
                            organizational expertise to every project. With an eye for design and a deep 
                            passion for event planning, they ensure that each client’s vision is met with 
                            precision and flair.
                            </p>
                        </div>
                    </section>
                    <section id='r2-story' className="relative overflow-visible">
                        <div className="r2 back-heading">
                            <h2>Our Story</h2>
                        </div>
                        <p>
                            What started as a passion for creating memorable experiences quickly turned into 
                            a growing business. REEBS Party Themes was founded with the belief that every 
                            celebration deserves a personal touch. Over the years, we have helped countless 
                            clients turn their dream events into reality, combining creativity, quality, and 
                            exceptional customer service.
                        </p>
                        <img
                            src="/imgs/bees.svg"
                            alt="bees overflow"
                            className="absolute bottom-[-480px] left-2/5 transform -translate-x-1/2 w-[1800px] z-60 pointer-events-none"
                        />
                    </section>
                    <section id='r1-social' className="relative h-screen overflow-visible">
                        <InstagramFeed />
                        <img
                            src="/imgs/bees2.svg"
                            alt="cloud overflow"
                            className="absolute bottom-[-150px] left-1/2 transform -translate-x-1/2 w-[1500px] z-60 pointer-events-none"
                        />
                    </section>
                </main>
            </div>
        </>
    )
}

export default About;