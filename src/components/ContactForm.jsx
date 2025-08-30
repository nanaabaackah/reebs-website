import React from 'react';

function ContactForm() {
    return(
        <>
            <form 
                className='contact-form'
                name="contact"
                method="POST"
                data-netlify="true"
                netlify-honeypot="bot-field"
            >
                <input type="hidden" name="form-name" value="contact" />
                <p className="hidden">
                    <label>
                    Don’t fill this out: <input name="bot-field" />
                    </label>
                </p>
                <div className="row form-group">
                    <div className="col-md-6">
                        <label>Name:</label>
                        <input type="text" name="name" required />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label>Email:</label>
                        <input type="email" name="email" required />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label>Phone Number:</label>
                        <input type="tel" name="phone" required />
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label>Your Message:</label>
                        <textarea name="message" id="message" cols="30" rows="7" className="form-control" placeholder="Ask anything" required></textarea>
                    </div>
                </div>
                <div className="form-group">
                    <button type="submit" className="btn btn-primary">Send Message</button>
                </div>
            </form>
        </>
    )
}

export default ContactForm;
