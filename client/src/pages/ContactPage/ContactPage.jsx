// client/src/pages/ContactPage.jsx
import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './ContactPage.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaPaperPlane, FaUser, FaTag } from 'react-icons/fa';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const { name, email, subject, message } = formData;

    const onChange = (e) => { /* ... (keep existing onChange) ... */
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setStatusMessage({ type: '', text: '' });
    };

    const onSubmit = (e) => { /* ... (keep existing onSubmit) ... */
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        if (!name || !email || !subject || !message) { setStatusMessage({ type: 'error', text: 'Please fill in all fields.' }); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' }); return; }
        console.log('Contact Form Submitted:', formData);
        setStatusMessage({ type: 'success', text: 'Thank you for your message! We will get back to you soon. (Simulated)' });
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page-container">
            <h1 className="contact-page-title">Get In Touch</h1>
            <p className="contact-page-subtitle">
                Have questions or feedback? Fill out the form below or reach out using our contact details.
            </p>

            <div className="contact-content-layout">
                {/* Contact Information Section */}
                <div className="contact-info-section">
                    <h2 className="contact-section-title">Contact Information</h2>
                    <div className="info-item">
                        <FaMapMarkerAlt className="info-icon" />
                        <div>
                            <strong>Address:</strong>
                            <p>Infocity Area (Near KIIT Square), Bhubaneswar,</p>
                            <p>Odisha, 751024, India (Representative Area)</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <FaPhoneAlt className="info-icon" />
                        <div>
                            <strong>Phone:</strong>
                            <p>(+91) 123-456-7890 (Placeholder)</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <FaEnvelope className="info-icon" />
                        <div>
                            <strong>Email:</strong>
                            <p>support@lmsplatform.placeholder</p>
                        </div>
                    </div>

                    {/* --- Add Map Container Here --- */}
                    <div className="map-container">
                        <h3 className="map-title">Our Location</h3>
                        {/* Replace the src="..." with the one you copied from Google Maps */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119614.107969596!2d85.7400008450166!3d20.34901217530179!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19091801ea7969%3A0x3904494645537301!2sKIIT%20Square!5e0!3m2!1sen!2sin!4v1713536788783!5m2!1sen!2sin"
                            width="100%" // Make width responsive
                            height="300" // Adjust height as needed
                            style={{ border: 0 }} // Keep style as is or move to CSS
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Office Location Map" // Add a title for accessibility
                        ></iframe>
                    </div>
                    {/* --- End Map Container --- */}

                </div>

                {/* Contact Form Section (Keep as is) */}
                <div className="contact-form-section">
                     <h2 className="contact-section-title">Send Us a Message</h2>
                    <form onSubmit={onSubmit} className="contact-form">
                       {/* ... (keep existing form inputs) ... */}
                        <Input label="Your Name" id="name" type="text" placeholder="Enter your full name" value={name} onChange={onChange} required icon={<FaUser />} />
                        <Input label="Your Email" id="email" type="email" placeholder="Enter your email address" value={email} onChange={onChange} required icon={<FaEnvelope />} />
                        <Input label="Subject" id="subject" type="text" placeholder="What is your message about?" value={subject} onChange={onChange} required icon={<FaTag />} />
                        <div className="input-group">
                            <label htmlFor="message" className="input-label">Message</label>
                            <textarea id="message" placeholder="Write your message here..." value={message} onChange={onChange} required rows={6} className="input-field" />
                        </div>
                        {statusMessage.text && ( <p className={`form-message ${statusMessage.type}`}> {statusMessage.text} </p> )}
                        <Button type="submit" variant="primary" className="submit-button"> <FaPaperPlane className="button-icon" /> Send Message </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
