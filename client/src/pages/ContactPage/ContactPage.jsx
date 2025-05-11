// client/src/pages/ContactPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector }from 'react-redux'; // Import Redux hooks
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner'; // For loading state
import './ContactPage.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaPaperPlane, FaUser, FaTag, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// Import Redux actions and selectors for contact form
import {
  submitContactForm,
  selectContactSubmissionStatus,
  selectContactSuccessMessage,
  selectContactError,
  clearContactStatus,
} from '../../features/contact/contactSlice'; // Adjust path as needed

const ContactPage = () => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    // Get state from Redux store
    const submissionStatus = useSelector(selectContactSubmissionStatus);
    const successMessage = useSelector(selectContactSuccessMessage);
    const submissionError = useSelector(selectContactError);

    const { name, email, subject, message } = formData;

    // Clear status messages when component unmounts or form data changes significantly
    useEffect(() => {
        return () => {
            dispatch(clearContactStatus());
        };
    }, [dispatch]);

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        // Optionally clear Redux messages on change if desired, or let submit handle it
        if (submissionStatus !== 'idle') {
            dispatch(clearContactStatus());
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearContactStatus()); // Clear previous messages before new submission

        if (!name || !email || !subject || !message) {
            // Client-side validation error (can be shown locally or via Redux error if preferred)
            // For consistency, we could dispatch an action that sets a specific client-side validation error
            // but for now, let's rely on backend validation or simple local handling.
            // If using Redux for all messages:
            // dispatch(submitContactForm.rejected("Please fill in all fields."));
            // However, typically thunks are for async ops. This is a sync validation.
            // For now, keeping it simple:
            alert("Please fill in all fields."); // Simple alert, or manage via local state if not using Redux for this
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        console.log('Dispatching submitContactForm with:', formData);
        try {
            // Dispatch the thunk
            const resultAction = await dispatch(submitContactForm(formData)).unwrap();
            // unwrap() will throw if rejected, otherwise contains fulfilled payload
            console.log('Contact form submission success:', resultAction); // resultAction is success message
            setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form on success
        } catch (errorPayload) {
            // Error is already set in Redux state by the rejected thunk
            console.error('Contact form submission failed:', errorPayload);
        }
    };

    return (
        <div className="contact-page-container page-container"> {/* Added page-container for consistency */}
            <h1 className="contact-page-title">Get In Touch</h1>
            <p className="contact-page-subtitle">
                Have questions or feedback? Fill out the form below or reach out using our contact details.
            </p>

            <div className="contact-content-layout">
                {/* Contact Information Section */}
                <div className="contact-info-section card-style"> {/* Added card-style */}
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
                            <p>support@lmsplatform.placeholder</p> {/* Use your actual email */}
                        </div>
                    </div>

                    <div className="map-container">
                        <h3 className="map-title">Our Location</h3>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119614.107969596!2d85.7400008450166!3d20.34901217530179!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19091801ea7969%3A0x3904494645537301!2sKIIT%20Square!5e0!3m2!1sen!2sin!4v1713536788783!5m2!1sen!2sin" // Replace with your actual map embed src
                            width="100%"
                            height="300"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Office Location Map"
                        ></iframe>
                    </div>
                </div>

                {/* Contact Form Section */}
                <div className="contact-form-section card-style"> {/* Added card-style */}
                     <h2 className="contact-section-title">Send Us a Message</h2>
                    <form onSubmit={onSubmit} className="contact-form">
                        <Input label="Your Name" id="name" type="text" placeholder="Enter your full name" value={name} onChange={onChange} required />
                        <Input label="Your Email" id="email" type="email" placeholder="Enter your email address" value={email} onChange={onChange} required />
                        <Input label="Subject" id="subject" type="text" placeholder="What is your message about?" value={subject} onChange={onChange} required />
                        <div className="input-group"> {/* Assuming Input doesn't handle Textarea, so direct structure */}
                            <label htmlFor="message" className="input-label">Message</label>
                            <textarea id="message" placeholder="Write your message here..." value={message} onChange={onChange} required rows={6} className="input-field" />
                        </div>

                        {/* Display Redux-managed status messages */}
                        {submissionStatus === 'succeeded' && successMessage && (
                            <p className="form-message success">
                                <FaCheckCircle /> {successMessage}
                            </p>
                        )}
                        {submissionStatus === 'failed' && submissionError && (
                            <p className="form-message error">
                                <FaExclamationTriangle /> {typeof submissionError === 'string' ? submissionError : JSON.stringify(submissionError)}
                            </p>
                        )}

                        <Button type="submit" variant="primary" className="submit-button" disabled={submissionStatus === 'loading'}>
                            {submissionStatus === 'loading' ? (
                                <Spinner size="small" />
                            ) : (
                                <FaPaperPlane className="button-icon" />
                            )}
                            {submissionStatus === 'loading' ? 'Sending...' : 'Send Message'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;