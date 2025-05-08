// client/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import "../AuthForm/AuthForm.css"; // Use shared CSS
import { useAuth } from '../../context/AuthContext'; // *** IMPORT useAuth ***

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // *** GET the login function from context ***
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value, // Relies on id prop on Input
    });
    if (error) {
      setError("");
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    // Note: Password length check might not be needed on login, only register
    // if (password.length < 6) {
    //  setError("Password must be at least 6 characters long");
    //  // Don't clear password on login validation error
    //  return;
    // }

    setError(""); // Clear previous errors before trying to log in
    console.log("Login attempt submitted:", formData);

    // ** Placeholder for Backend API Call **
    // Replace this section with actual API call later
    // try {
    //   // const apiResponse = await authService.login({ email, password });
    //   // console.log('Login successful:', apiResponse);

    //   // --- If API call is successful ---
    //   const userDataFromApi = {
    //      id: apiResponse.user.id,
    //      name: apiResponse.user.name,
    //      email: apiResponse.user.email,
    //      role: apiResponse.user.role
    //      // token: apiResponse.token // Usually store token separately
    //   };
    //   login(userDataFromApi); // *** CALL context login function ***
    //   navigate('/dashboard'); // Redirect AFTER successful login
    //   // --- End API Success ---

    // } catch (apiError) {
    //    console.error('Login failed:', apiError);
    //    setError(apiError.message || 'Login failed. Please check credentials.');
    // }


    // --- Simulate successful login FOR NOW ---
    alert("Login submitted (See console for data). Simulating success...");
    const simulatedUserData = {
      id: 'user123',
      name: 'Test User', // You might get the actual name from API later
      email: formData.email,
      role: 'student'
    };
    login(simulatedUserData); // *** CALL context login function ***
    navigate('/dashboard'); // Redirect AFTER successful login
    // --- End Simulation ---

    // Don't clear form here immediately, only after successful API response/navigation
    // setFormData({ email: "", password: "" });
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={onSubmit}>
        <h2>Login</h2>

        {/* *** DISPLAY Error Message *** */}
        {error && <p className="auth-error">{error}</p>}

        <Input
          label="Email"
          id="email" // *** ADD id ***
          type="email"
          placeholder="Enter your email"
          value={email} // *** ADD value ***
          onChange={onChange}
          required
        />
        <Input
          label="Password"
          id="password" // *** ADD id ***
          type="password"
          placeholder="Enter your password"
          value={password} // *** ADD value ***
          onChange={onChange}
          required
        />
        <Button type="submit" variant="primary" fullWidth>Login</Button>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
