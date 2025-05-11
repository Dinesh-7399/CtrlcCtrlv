// client/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner'; // For loading state
import "../AuthForm/AuthForm.css"; // Use shared CSS
import { useAuth } from '../../context/AuthContext';

// --- Redux Imports ---
import { useSelector, useDispatch } from 'react-redux';
import {
  selectAuthLoading,
  selectAuthError,
  clearAuthError // Action to clear auth errors
} from '../../features/users/UsersSlice'; // Adjust path as necessary
// registerUser thunk is called by authContext.register

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, isAuthenticated } = useAuth(); // Get register function and isAuthenticated state

  // --- Redux State ---
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "", // For password confirmation
  });
  const [clientError, setClientError] = useState(''); // For client-side validation errors

  const { name, email, password, password2 } = formData;

  // Clear auth error when component mounts
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Redirect if registration leads to authentication (depends on backend logic)
  useEffect(() => {
    if (isAuthenticated) {
        // If backend auto-logins after registration
        navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);


  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    if (clientError) setClientError(""); // Clear client-side error on input change
    if (authError) dispatch(clearAuthError()); // Clear Redux error on input change
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError()); // Clear previous Redux errors
    setClientError(""); // Clear previous client errors

    if (!name || !email || !password || !password2) {
      setClientError("Please fill in all fields.");
      return;
    }
    if (password !== password2) {
      setClientError("Passwords do not match.");
      setFormData((prev) => ({ ...prev, password: "", password2: "" }));
      return;
    }
    if (password.length < 6) {
      setClientError("Password must be at least 6 characters long.");
      setFormData((prev) => ({ ...prev, password: "", password2: "" }));
      return;
    }

    try {
      // Call the register function from AuthContext
      // It internally dispatches the registerUser thunk from UsersSlice
      const registeredUser = await register({ name, email, password }); // Send only necessary fields to API
      
      // If registerUser thunk is successful and doesn't auto-login:
      if (registeredUser && !isAuthenticated) { // Check if user object returned and not auto-authed
        alert("Registration successful! Please check your email for verification or log in."); // Adjust message
        navigate("/login"); // Navigate to login after successful registration
      }
      // If backend auto-logins, the useEffect for isAuthenticated will handle redirect.

      // Clear form only on successful API call if not redirecting immediately
      // setFormData({ name: "", email: "", password: "", password2: "" });

    } catch (error) {
      // Error is already set in Redux state (authError) by the rejected thunk.
      // The component will re-render and display authError.
      console.error("Registration failed from RegisterPage:", error);
      // If error is an object with a message property (typical for network errors / unhandled backends)
      // and authError from Redux is not specific enough, you could use it:
      // if (typeof error === 'object' && error.message && !authError) {
      //   setClientError(error.message);
      // }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={onSubmit}>
        <h2>Create Account</h2>

        {clientError && <p className="auth-error">{clientError}</p>}
        {authError && !clientError && <p className="auth-error">{typeof authError === 'string' ? authError : "Registration failed. Please try again."}</p>}

        <Input
          label="Full Name"
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={onChange}
          required
          disabled={isLoading}
        />
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={onChange}
          required
          disabled={isLoading}
        />
        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={onChange}
          required
          disabled={isLoading}
        />
        <Input
          label="Confirm Password"
          id="password2"
          type="password"
          placeholder="Confirm your password"
          value={password2}
          onChange={onChange}
          required
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? <Spinner size="small" /> : 'Register'}
        </Button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;