// client/src/pages/CheckoutPage/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }
from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// --- Component/Util Imports ---
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { selectCourseById } from '../../features/courses/CoursesSlice.js';
import { useAuth } from '../../context/AuthContext'; // For current user
import { FaRupeeSign, FaLock, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import './CheckoutPage.css';

// --- Redux Payment Slice Imports ---
import {
  createPaymentOrder,
  verifyPayment,
  selectOrderDetails,
  selectCreateOrderStatus,
  selectCreateOrderError,
  selectVerifyPaymentStatus,
  selectVerifyPaymentError,
  selectPaymentSuccessDetails,
  clearPaymentState,
  clearCreateOrderError,
  clearVerifyPaymentError,
} from '../../features/payment/paymentSlice';

const loadRazorpayScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Auth and Course Data ---
  const { user: currentUser } = useAuth(); // Get current user from AuthContext
  const course = useSelector((state) => selectCourseById(state, courseId));

  // --- Payment Slice State ---
  const orderDetailsFromState = useSelector(selectOrderDetails);
  const createOrderStatus = useSelector(selectCreateOrderStatus);
  const createOrderError = useSelector(selectCreateOrderError);
  const verifyPaymentStatus = useSelector(selectVerifyPaymentStatus);
  const verifyPaymentError = useSelector(selectVerifyPaymentError);
  const paymentSuccessDetails = useSelector(selectPaymentSuccessDetails);

  // --- Local UI State ---
  const [initialLoadingError, setInitialLoadingError] = useState(''); // For Razorpay script loading error

  useEffect(() => {
    // Clear payment state when component unmounts or courseId changes
    return () => {
      dispatch(clearPaymentState());
    };
  }, [dispatch, courseId]);

  // Effect to handle Razorpay checkout opening when order is created
  useEffect(() => {
    const openRazorpayCheckout = async () => {
      if (createOrderStatus === 'succeeded' && orderDetailsFromState) {
        const scriptLoaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!scriptLoaded) {
          dispatch(clearPaymentState()); // Reset state
          setInitialLoadingError("Failed to load payment gateway. Please try again.");
          return;
        }

        const { amount, id: order_id, currency, key: key_id } = orderDetailsFromState;

        const options = {
          key: key_id,
          amount: amount.toString(),
          currency: currency,
          name: "LMS Platform", // Replace with your platform name
          description: `Enrollment: ${course?.title || 'Course Purchase'}`,
          image: "/logo.png", // Replace with your logo URL
          order_id: order_id,
          handler: async function (response) {
            console.log("Razorpay Success Response:", response);
            dispatch(clearVerifyPaymentError()); // Clear previous verification errors
            dispatch(verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: courseId, // Include courseId for context
            }));
          },
          prefill: {
            name: currentUser?.name || "",
            email: currentUser?.email || "",
            contact: currentUser?.profile?.phone || "", // Assuming phone is in profile object
          },
          notes: {
            courseId: courseId,
            courseTitle: course?.title,
            userId: currentUser?.id
          },
          theme: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || "#0056d2",
          },
          modal: {
            ondismiss: function () {
              console.log('Razorpay checkout modal dismissed.');
              dispatch(clearPaymentState()); // Reset state as process is cancelled
              // No need to set local paymentError here, as createOrderError will handle order creation issues
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.error("Razorpay Payment Failed:", response.error);
          // Dispatch an action or set error state in Redux if needed
          // For now, this will be handled by the user closing the modal, or not proceeding.
          // If you want to show a specific error, dispatch an action here.
           dispatch(clearPaymentState()); // Reset payment attempt
           // Consider setting a specific local error for this modal failure if needed
        });
        rzp.open();
      }
    };

    openRazorpayCheckout();
  }, [createOrderStatus, orderDetailsFromState, dispatch, courseId, course?.title, currentUser]);

  // Effect to navigate on successful payment verification
  useEffect(() => {
    if (verifyPaymentStatus === 'succeeded' && paymentSuccessDetails?.success) {
      alert(paymentSuccessDetails.message || "Payment Successful & Verified! You are now enrolled.");
      navigate('/dashboard?enrollment=success');
    }
  }, [verifyPaymentStatus, paymentSuccessDetails, navigate]);


  const handleInitiateCheckout = () => {
    if (!courseId) {
        setInitialLoadingError("Course ID is missing."); // Should not happen if routing is correct
        return;
    }
    dispatch(clearPaymentState()); // Clear any previous state before starting
    setInitialLoadingError(''); // Clear script loading error
    dispatch(createPaymentOrder(courseId));
  };

  // --- Render Logic ---
  if (!course) {
    return (
      <div className="checkout-container page-container checkout-status">
        <Spinner label="Loading course details..." />
      </div>
    );
  }

  // Determine overall processing state
  const isProcessing = createOrderStatus === 'loading' || verifyPaymentStatus === 'loading';

  return (
    <div className="checkout-container page-container">
      <Button onClick={() => navigate(`/courses/${courseId}`)} variant="link" size="small" className="back-to-course-button">
        <FaArrowLeft /> Back to Course Details
      </Button>

      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-layout">
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
            </div>
            <div className="summary-price">
              <FaRupeeSign /> {course.price ? course.price.toLocaleString('en-IN') : '0.00'}
            </div>
          </div>
          <div className="summary-total">
            <span>Total Amount:</span>
            <span><FaRupeeSign /> {course.price ? course.price.toLocaleString('en-IN') : '0.00'}</span>
          </div>
        </section>

        <section className="payment-section">
          <h2>Payment Information</h2>
          {initialLoadingError && (
            <p className="payment-error"><FaExclamationTriangle /> {initialLoadingError}</p>
          )}
          {createOrderStatus === 'failed' && createOrderError && (
            <p className="payment-error"><FaExclamationTriangle /> {typeof createOrderError === 'string' ? createOrderError : JSON.stringify(createOrderError)}</p>
          )}
          {verifyPaymentStatus === 'failed' && verifyPaymentError && (
             <p className="payment-error"><FaExclamationTriangle /> {typeof verifyPaymentError === 'string' ? verifyPaymentError : JSON.stringify(verifyPaymentError)}</p>
          )}

          <Button
            variant="primary"
            size="large"
            fullWidth
            className="checkout-button"
            onClick={handleInitiateCheckout}
            disabled={isProcessing || !course.price || course.price <= 0}
          >
            {isProcessing ? (
              <span className="loading-dots" aria-hidden="true"><span></span><span></span><span></span></span>
            ) : (
              <><FaLock /> Proceed to Pay</>
            )}
          </Button>

          <p className="security-notice">
            <FaLock /> Secure payment powered by Razorpay.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CheckoutPage;