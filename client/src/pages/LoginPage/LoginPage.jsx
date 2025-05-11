// client/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
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
// loginUser thunk is called by authContext.login, so not directly dispatched here

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // To get the 'from' location for redirect after login
  const dispatch = useDispatch();
  const { login, isAuthenticated } = useAuth(); // login function from context

  // --- Redux State ---
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { email, password } = formData;

  // Clear auth error when component mounts or form data changes
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    if (authError) { // Clear Redux error if user starts typing
      dispatch(clearAuthError());
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError()); // Clear previous errors

    if (!email || !password) {
      // Dispatch an action or set a local error for client-side validation
      // For simplicity with Redux focus, often backend validation is primary for auth forms.
      // If using Redux for this: dispatch(setAuthError("Please fill in all fields."));
      // For now, let the backend handle this or rely on 'required' prop of Input.
      // Or, set a local error if preferred for immediate feedback:
      // setLocalValidationError("Please fill in all fields.");
      return;
    }

    try {
      await login({ email, password }); // Call the login function from AuthContext
      // AuthContext and UsersSlice handle setting isAuthenticated and currentUser
      // Navigation will be handled by PrivateRoute or by checking isAuthenticated below
    } catch (error) {
      // The login function from AuthContext (which uses loginUser thunk)
      // should have already set the error in Redux state.
      // No need to `setError(apiError.message)` here if authError selector is used.
      console.error('Login failed from LoginPage:', error);
    }
  };

  // Redirect if already authenticated or after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={onSubmit}>
        <h2>Login</h2>

        {authError && <p className="auth-error">{typeof authError === 'string' ? authError : "Login failed. Please check your credentials."}</p>}

        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={onChange}
          required
          disabled={isLoading}
        />
        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={onChange}
          required
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? <Spinner size="small" /> : 'Login'}
        </Button>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
         <p className="auth-switch" style={{marginTop: "var(--spacing-sm)"}}>
            <Link to="/request-password-reset">Forgot Password?</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;