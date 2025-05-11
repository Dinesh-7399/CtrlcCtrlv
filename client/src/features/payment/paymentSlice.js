// src/features/payment/paymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createPaymentOrderAPI, verifyPaymentAPI } from '../../services/paymentService';
// Import an action to refresh user's enrolled courses after successful payment
import { fetchMyEnrolledCourses } from '../courses/CoursesSlice'; // Assuming this thunk exists

export const createPaymentOrder = createAsyncThunk(
  'payment/createOrder',
  async (courseId, { rejectWithValue }) => {
    try {
      const apiResponse = await createPaymentOrderAPI(courseId);
      if (apiResponse.success) {
        return apiResponse.data; // { id (order_id), amount, currency, key (key_id) }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to create order.');
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Error creating payment order.');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async (verificationData, { dispatch, rejectWithValue }) => {
    try {
      const apiResponse = await verifyPaymentAPI(verificationData);
      if (apiResponse.success) {
        // After successful verification, dispatch action to update user's enrolled courses
        dispatch(fetchMyEnrolledCourses());
        return apiResponse; // { success: true, message: "Payment verified successfully..." }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Payment verification failed.');
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Error verifying payment.');
    }
  }
);

const initialState = {
  orderDetails: null,       // To store order details from createPaymentOrder
  createOrderStatus: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
  createOrderError: null,

  verifyPaymentStatus: 'idle',// 'idle' | 'loading' | 'succeeded' | 'failed'
  verifyPaymentError: null,
  paymentSuccessDetails: null, // To store success message or details from verifyPayment
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.orderDetails = null;
      state.createOrderStatus = 'idle';
      state.createOrderError = null;
      state.verifyPaymentStatus = 'idle';
      state.verifyPaymentError = null;
      state.paymentSuccessDetails = null;
    },
    clearCreateOrderError: (state) => {
      state.createOrderError = null;
    },
    clearVerifyPaymentError: (state) => {
      state.verifyPaymentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Order
      .addCase(createPaymentOrder.pending, (state) => {
        state.createOrderStatus = 'loading';
        state.orderDetails = null;
        state.createOrderError = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.createOrderStatus = 'succeeded';
        state.orderDetails = action.payload; // { id, amount, currency, key }
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.createOrderStatus = 'failed';
        state.createOrderError = action.payload;
      })
      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.verifyPaymentStatus = 'loading';
        state.verifyPaymentError = null;
        state.paymentSuccessDetails = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verifyPaymentStatus = 'succeeded';
        state.paymentSuccessDetails = action.payload; // { success: true, message: "..." }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verifyPaymentStatus = 'failed';
        state.verifyPaymentError = action.payload;
      });
  },
});

export const { clearPaymentState, clearCreateOrderError, clearVerifyPaymentError } = paymentSlice.actions;

// Selectors
export const selectOrderDetails = (state) => state.payment.orderDetails;
export const selectCreateOrderStatus = (state) => state.payment.createOrderStatus;
export const selectCreateOrderError = (state) => state.payment.createOrderError;
export const selectVerifyPaymentStatus = (state) => state.payment.verifyPaymentStatus;
export const selectVerifyPaymentError = (state) => state.payment.verifyPaymentError;
export const selectPaymentSuccessDetails = (state) => state.payment.paymentSuccessDetails;

export default paymentSlice.reducer;