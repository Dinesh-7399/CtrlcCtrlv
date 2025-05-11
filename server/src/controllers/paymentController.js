// server/src/controllers/paymentController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';
import Razorpay from 'razorpay';
import crypto from 'crypto'; // For webhook signature verification

// Initialize Razorpay instance
// Ensure these are loaded correctly from your .env file
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("FATAL ERROR: Razorpay Key ID or Key Secret is not defined in .env file.");
  // In a real app, you might prevent startup or handle this more gracefully
  // For now, we'll let it potentially fail at runtime if keys are missing.
}

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a Razorpay order for a course
 * @route   POST /api/payment/create-order
 * @access  Private (Authenticated Users)
 * @body    { courseId: number }
 */
export const createPaymentOrder = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { courseId } = req.body;
  const userId = req.user.userId; // From authMiddleware

  if (!courseId) {
    return next(new ApiError(400, 'Course ID is required to create a payment order.'));
  }
  const numericCourseId = parseInt(courseId, 10);
  if (isNaN(numericCourseId)) {
    return next(new ApiError(400, 'Invalid Course ID format.'));
  }

  try {
    // 1. Fetch course details to get the price
    const course = await prisma.course.findUnique({
      where: { id: numericCourseId, status: 'PUBLISHED' }, // Ensure course is published
    });

    if (!course) {
      return next(new ApiError(404, `Published course with ID ${numericCourseId} not found.`));
    }

    if (course.price <= 0) {
      return next(new ApiError(400, 'This course is free or has an invalid price for payment.'));
    }

    // 2. Check if user is already enrolled (optional, but good to prevent re-payment)
    const existingEnrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: numericCourseId } }
    });
    if (existingEnrollment) {
        return next(new ApiError(409, 'You are already enrolled in this course.'));
    }


    // 3. Create Razorpay order options
    // Amount is in the smallest currency unit (e.g., paise for INR)
    const amountInPaise = Math.round(course.price * 100);
    const currency = 'INR'; // Or get from course/platform settings
    const receiptId = `receipt_user_${userId}_course_${numericCourseId}_${Date.now()}`;

    const razorpayOrderOptions = {
      amount: amountInPaise,
      currency: currency,
      receipt: receiptId,
      notes: {
        courseId: numericCourseId,
        courseTitle: course.title,
        userId: userId,
      },
    };

    // 4. Create order with Razorpay
    const razorpayOrder = await razorpayInstance.orders.create(razorpayOrderOptions);

    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error('Failed to create Razorpay order.');
    }

    // 5. (Optional but Recommended) Create a PENDING order record in your database
    await prisma.order.create({
      data: {
        userId,
        courseId: numericCourseId,
        amount: course.price,
        currency,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id, // Store Razorpay's order_id
        paymentGateway: 'razorpay',
      },
    });

    // 6. Send Razorpay order details back to the client
    return res.status(201).json(
      new ApiResponse(
        201,
        {
          keyId: RAZORPAY_KEY_ID, // Your Razorpay Key ID
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount, // Amount in paise
          currency: razorpayOrder.currency,
          courseTitle: course.title, // For display on checkout
          // You can also send prefill data for user if available
          // prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone }
        },
        'Razorpay order created successfully.'
      )
    );
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    next(new ApiError(500, 'Failed to create payment order.', [error.message]));
  }
};

/**
 * @desc    Verify Razorpay payment and enroll user
 * @route   POST /api/payment/verify
 * @access  Private (Authenticated Users)
 * @body    { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId }
 */
export const verifyPaymentAndEnroll = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
  const userId = req.user.userId;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
    return next(new ApiError(400, 'Missing required payment verification details.'));
  }
  const numericCourseId = parseInt(courseId, 10);
   if (isNaN(numericCourseId)) {
    return next(new ApiError(400, 'Invalid Course ID format.'));
  }


  try {
    // 1. Construct the string for signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // 2. Compare signatures
    if (expectedSignature !== razorpay_signature) {
      // Update order status to FAILED in your DB
      await prisma.order.updateMany({
        where: { razorpayOrderId: razorpay_order_id, userId },
        data: { status: 'FAILED', transactionId: razorpay_payment_id, razorpaySignature: razorpay_signature },
      });
      return next(new ApiError(400, 'Payment verification failed. Invalid signature.'));
    }

    // 3. Signature is valid. Update your Order record to COMPLETED.
    const updatedOrder = await prisma.order.updateMany({ // updateMany in case there was a duplicate PENDING order (shouldn't happen with unique constraint)
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: userId,
        status: 'PENDING', // Only update if it was pending
      },
      data: {
        status: 'COMPLETED',
        transactionId: razorpay_payment_id,
        razorpayPaymentId: razorpay_payment_id, // Store specific razorpay payment id
        razorpaySignature: razorpay_signature,
        updatedAt: new Date(),
      },
    });

    if (updatedOrder.count === 0) {
        // This might happen if the order was already processed or not found in PENDING state
        console.warn(`Order ${razorpay_order_id} for user ${userId} not found in PENDING state or already processed.`);
        // Check if already enrolled as a fallback
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: numericCourseId } }
        });
        if (existingEnrollment) {
            return res.status(200).json(new ApiResponse(200, { enrollment: existingEnrollment }, 'Payment already verified and user enrolled.'));
        }
        return next(new ApiError(404, 'Order not found or already processed. Please contact support if issues persist.'));
    }

    // 4. Create Enrollment record
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: numericCourseId,
        enrolledAt: new Date(),
        // You might link the orderId here if your schema supports it
        // orderId: updatedOrder.id (if updateMany returned the ID, or fetch it)
      },
      include: { course: { select: { title: true } } }
    });

    // TODO:
    // - Send successful enrollment email.
    // - Notify instructor.

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          enrollmentId: enrollment.id,
          courseTitle: enrollment.course.title,
          message: 'Payment verified and enrollment successful!',
        },
        'Payment verified successfully.'
      )
    );

  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    // Attempt to update order to FAILED on generic error during verification
    try {
        await prisma.order.updateMany({
            where: { razorpayOrderId: razorpay_order_id, userId: userId, status: 'PENDING' },
            data: { status: 'FAILED', transactionId: razorpay_payment_id },
        });
    } catch (dbError) {
        console.error('Failed to update order to FAILED status after verification error:', dbError);
    }
    next(new ApiError(500, 'Payment verification process failed.', [error.message]));
  }
};


/**
 * @desc    Handle Razorpay Webhooks (e.g., payment.failed, order.paid)
 * @route   POST /api/payment/webhook/razorpay
 * @access  Public (Secured by webhook signature verification)
 */
export const handleRazorpayWebhook = async (req, res, next) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // You need to set this in Razorpay dashboard and .env

    if (!secret) {
        console.error('Razorpay webhook secret not configured.');
        return res.status(500).send('Webhook secret not configured.');
    }

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
        console.warn('Webhook signature mismatch.');
        return res.status(400).send('Invalid signature.');
    }

    // Signature is valid, process the event
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Received Razorpay webhook event: ${event}`);

    try {
        switch (event) {
            case 'payment.failed':
                const paymentFailed = payload.payment.entity;
                await prisma.order.updateMany({
                    where: { razorpayOrderId: paymentFailed.order_id, status: 'PENDING' },
                    data: {
                        status: 'FAILED',
                        transactionId: paymentFailed.id,
                        updatedAt: new Date(),
                    },
                });
                console.log(`Order ${paymentFailed.order_id} marked as FAILED due to payment failure.`);
                break;

            case 'payment.captured': // Or 'order.paid' if you prefer to rely on order status
                const paymentCaptured = payload.payment.entity;
                const orderId = paymentCaptured.order_id;

                // Check if order exists and is PENDING
                const order = await prisma.order.findFirst({
                    where: { razorpayOrderId: orderId, status: 'PENDING' },
                    include: { user: true, course: true }
                });

                if (order) {
                    await prisma.$transaction(async (tx) => {
                        await tx.order.update({
                            where: { id: order.id },
                            data: {
                                status: 'COMPLETED',
                                transactionId: paymentCaptured.id,
                                razorpayPaymentId: paymentCaptured.id,
                                // razorpaySignature can be stored if needed, but already verified by webhook
                                updatedAt: new Date(),
                            },
                        });

                        // Check if enrollment already exists (idempotency for webhooks)
                        const existingEnrollment = await tx.enrollment.findUnique({
                            where: { userId_courseId: { userId: order.userId, courseId: order.courseId } }
                        });

                        if (!existingEnrollment) {
                            await tx.enrollment.create({
                                data: {
                                    userId: order.userId,
                                    courseId: order.courseId,
                                    enrolledAt: new Date(),
                                },
                            });
                            console.log(`User ${order.userId} enrolled in course ${order.courseId} via webhook for order ${orderId}.`);
                            // TODO: Send success email/notifications from here if not handled by verify endpoint
                        } else {
                             console.log(`Enrollment already exists for user ${order.userId} in course ${order.courseId} for order ${orderId}. Webhook processing skipped for enrollment.`);
                        }
                    });
                } else {
                    console.warn(`Received webhook for already processed or unknown order: ${orderId}`);
                }
                break;

            // Add more event handlers as needed (e.g., payment.authorized, refund.processed)
            default:
                console.log(`Unhandled Razorpay webhook event: ${event}`);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Error processing Razorpay webhook:', error);
        // Don't pass to global error handler for webhooks, just send 500
        res.status(500).json({ error: 'Webhook processing failed.' });
    }
};
