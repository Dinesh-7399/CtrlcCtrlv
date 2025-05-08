import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// --- Component/Util Imports ---
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { selectCourseById } from '../../features/courses/CoursesSlice.js'; // Adjust path/casing if needed
// Optional: Import user selector if you have user email/phone for prefill
// import { selectCurrentUser } from '../../features/auth/authSlice';
import { FaRupeeSign, FaLock, FaArrowLeft } from 'react-icons/fa';
import './CheckoutPage.css'; // We'll create this CSS file

// --- Helper Function to Load Razorpay Script ---
// (Could be moved to a utility file)
const loadRazorpayScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
// --- End Helper Function ---

const CheckoutPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // --- Redux State ---
    const course = useSelector((state) => selectCourseById(state, courseId));
    // Optional: Get current user details for prefill
    // const currentUser = useSelector(selectCurrentUser);
    // --- End Redux State ---

    // --- Local State ---
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    // --- End Local State ---

    // --- Payment Handler ---
    const handleCheckout = async () => {
        setPaymentError('');
        setIsProcessingPayment(true);

        // 1. Load Razorpay Script
        const scriptLoaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!scriptLoaded) {
            setPaymentError("Failed to load payment gateway. Please check your connection or try again later.");
            setIsProcessingPayment(false);
            return;
        }

        // --- Razorpay Integration Logic ---
        try {
            // 2. Call your backend to create an order
            //    Replace '/api/payment/create-order' with your actual backend endpoint
            const orderResponse = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send courseId to backend to determine amount, etc.
                body: JSON.stringify({ courseId: courseId }),
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to create payment order on server.');
            }

            const orderData = await orderResponse.json();
            const { amount, id: order_id, currency, key: key_id } = orderData; // Extract data from backend response

             if (!order_id || !key_id || !amount || !currency) {
                throw new Error('Invalid order data received from server.');
            }

            // 3. Configure Razorpay Options
            const options = {
                key: key_id, // Your Razorpay Key ID from backend
                amount: amount.toString(), // Amount should be in paise, received from backend
                currency: currency, // e.g., "INR" from backend
                name: "Your Platform Name", // Replace with your platform name
                description: `Enrollment: ${course?.title || 'Course Purchase'}`,
                image: "/logo.png", // Replace with your logo URL
                order_id: order_id, // The order_id obtained from your backend
                handler: async function (response) {
                    // 4. Handle SUCCESSFUL payment: Send details back to backend for verification
                    console.log("Razorpay Success Response:", response);
                    setPaymentError(''); // Clear any previous error
                    // TODO: Show temporary success message before verification?

                    try {
                        // Replace '/api/payment/verify' with your actual verification endpoint
                        const verifyResponse = await fetch('/api/payment/verify', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                               razorpay_order_id: response.razorpay_order_id,
                               razorpay_payment_id: response.razorpay_payment_id,
                               razorpay_signature: response.razorpay_signature,
                               courseId: courseId // Send courseId for context if needed
                           }),
                        });

                        if (!verifyResponse.ok) {
                           throw new Error('Payment verification failed on server.');
                        }

                        const verificationResult = await verifyResponse.json();

                        if (verificationResult.success) {
                            // Payment Verified! Enroll user, navigate to dashboard/success page
                            alert("Payment Successful & Verified! You are now enrolled.");
                            // TODO: Dispatch action to update user enrollment state in Redux
                            navigate('/dashboard?enrollment=success'); // Redirect after success
                        } else {
                            // Verification failed on backend
                            setPaymentError("Payment verification failed. Please contact support.");
                        }

                    } catch (verificationError) {
                        console.error("Verification API Error:", verificationError);
                        setPaymentError("Error verifying payment. Please contact support.");
                    } finally {
                         setIsProcessingPayment(false); // Re-enable button after verification attempt
                    }
                },
                prefill: {
                    // Optional: Prefill user details if available
                    // name: currentUser?.name || "",
                    // email: currentUser?.email || "",
                    // contact: currentUser?.phone || "",
                },
                notes: {
                    courseId: courseId,
                    courseTitle: course?.title,
                    // userId: currentUser?.id // Example: Add user ID if available
                },
                theme: {
                    color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || "#3399cc", // Use CSS variable or fallback
                },
                modal: {
                    ondismiss: function () {
                        console.log('Razorpay checkout modal dismissed.');
                        setPaymentError('Payment process cancelled.'); // Inform user
                        setIsProcessingPayment(false); // Re-enable button
                    }
                }
            };

            // 5. Open Razorpay Checkout Modal
            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response) {
                // 6. Handle FAILED payment
                console.error("Razorpay Payment Failed:", response.error);
                setPaymentError(`Payment Failed: ${response.error.description || 'Unknown error'} (Code: ${response.error.code || 'N/A'})`);
                // Optionally send failure details to backend for logging
                setIsProcessingPayment(false); // Re-enable button
            });

            rzp.open();

        } catch (error) {
            console.error("Checkout Error:", error);
            setPaymentError(`An error occurred: ${error.message}. Please try again.`);
            setIsProcessingPayment(false); // Re-enable button on error
        }
        // --- End Razorpay Integration Logic ---
    };


    // --- Render Logic ---
    if (!course) {
        // Handle case where course data isn't available (maybe invalid ID or still loading)
        // Consider adding a Redux loading status check here too
        return (
            <div className="checkout-container page-container checkout-status">
                <Spinner label="Loading course details..." />
                 {/* Or show "Course Not Found" message */}
            </div>
        );
    }

    return (
        <div className="checkout-container page-container">
            <Button onClick={() => navigate(`/courses/${courseId}`)} variant="link" size="small" className="back-to-course-button">
                <FaArrowLeft /> Back to Course Details
            </Button>

            <h1 className="checkout-title">Checkout</h1>

            <div className="checkout-layout">
                {/* Order Summary Section */}
                <section className="order-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-item">
                        <img
                            src={course.thumbnail || 'https://via.placeholder.com/100x60/cccccc/ffffff?text=Course'}
                            alt={`${course.title} thumbnail`}
                            className="summary-thumbnail"
                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/100x60/cccccc/ffffff?text=Error"; }}
                        />
                        <div className="summary-details">
                            <h3 className="summary-title">{course.title}</h3>
                            {/* Optional: Instructor Name */}
                            {/* <p className="summary-instructor">Instructor: {instructor?.name || 'N/A'}</p> */}
                        </div>
                        <div className="summary-price">
                            <FaRupeeSign /> {course.price.toLocaleString('en-IN')}
                        </div>
                    </div>
                    {/* Add other summary details if needed */}
                    <div className="summary-total">
                        <span>Total Amount:</span>
                        <span><FaRupeeSign /> {course.price.toLocaleString('en-IN')}</span>
                    </div>
                </section>

                {/* Payment Section */}
                <section className="payment-section">
                    <h2>Payment Information</h2>
                     {/* Display any payment errors */}
                    {paymentError && (
                        <p className="payment-error"><FaExclamationTriangle /> {paymentError}</p>
                    )}

                    {/* Payment Button */}
                    <Button
                        variant="primary"
                        size="large"
                        fullWidth
                        className="checkout-button"
                        onClick={handleCheckout}
                        disabled={isProcessingPayment || !course.price || course.price <= 0} // Disable if processing or no price
                    >
                        {isProcessingPayment ? (
                             <span className="loading-dots" aria-hidden="true"><span></span><span></span><span></span></span> // Use loading dots
                        ) : (
                            <>
                                <FaLock /> Proceed to Pay
                            </>
                        )}
                    </Button>

                     {/* Security Notice */}
                    <p className="security-notice">
                        <FaLock /> Secure payment powered by Razorpay.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default CheckoutPage;