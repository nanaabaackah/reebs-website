import React, { useState } from 'react';
//import BrushCanvas from '/src/components/BrushCanvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import InstagramFeed from '/src/components/InstagramFeed';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import galleryImages from "/src/data/galleryImages.json"
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import './master.css';

function Gallery() {
    const [selectedImage, setSelectedImage] = useState(null);
    
    return (
        <>
            <div className='r5'>
                <main className="r5 back">
                    <section id='r5-intro'>
                        <div className="r5 back-heading">
                            <h1>Gallery</h1>
                            <p>
                                A peek into the beautiful moments we’ve helped create.
                            </p>
                        </div>
                        <img
                            src="/imgs/leaves4.svg"
                            alt="popcorn overflow"
                            className="absolute top-[200px] left-1/2 transform -translate-x-1/2 w-[1450px] z-60 pointer-events-none"
                        />
                    </section>
                    <section id='r5-gallery' className="relative h-screen overflow-visible">
                        <div className="gallery-container">
                            <div className="gallery-grid">
                                {galleryImages.map((item, index) => (
                                <div key={index} className="gallery-card">
                                    <img
                                    src={item.src}
                                    alt={item.title}
                                    onClick={() => setSelectedImage(item)}
                                    className="gallery-img"
                                    />
                                    <div className="gallery-caption">
                                    <h3>{item.title}</h3>
                                    </div>
                                </div>
                                ))}
                            </div>
                            {selectedImage && (
                                <div className="lightbox" onClick={() => setSelectedImage(null)}>
                                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                                        <img src={selectedImage.src} alt={selectedImage.title} />
                                        <h3>{selectedImage.title}</h3>
                                        <p>{selectedImage.description}</p>
                                        <button onClick={() => setSelectedImage(null)}>Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                    <section id="r5-cta" className="relative h-screen overflow-visible">
                        <div className='cta-heading'>
                            <h1>Love what you see? Let’s make it happen!</h1>
                            <h2>Contact Us Today!</h2>
                        </div>
                        <div className='cta-buttons'>
                            <Link to="tel:+233-244-238-419" className='btn'><FontAwesomeIcon icon={faPhone} /></Link>
                            <Link to="" className='btn'><FontAwesomeIcon icon={faWhatsapp} /></Link>
                            <Link to="mailto:info@reebspartythemes.com" className='btn'><FontAwesomeIcon icon={faEnvelope} /></Link>
                        </div>
                    </section>
                    <section id='r1-social' className="relative h-screen overflow-visible">
                        <img
                            src="/imgs/tree.svg"
                            alt="tree overflow"
                            className="absolute bottom-[-50px] left-1/3 transform -translate-x-1/2 w-[900px] z-60 pointer-events-none"
                        />
                        <InstagramFeed />
                    </section>
                </main>
            </div>
        </>
    )
}

export default Gallery;