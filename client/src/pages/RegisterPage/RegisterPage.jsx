import React, { useState } from "react";
import "../AuthForm/AuthForm.css"; // Use shared CSS
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  });
  const[error, setError] = useState("");
  const { name, email, password, password2 } = formData;
  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    if (error) {
      setError("");
    }
  };
  const onSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !password2) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match");
      setFormData((prev) => ({ ...prev, password: "", password2: "" }));
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setFormData((prev) => ({ ...prev, password: "", password2: "" }));
      return;
    }
    setError("");
    console.log("Form submitted successfully!", formData);
    alert("Register submitted (see console.for data). API call pending");
    setFormData({
      name: "",
      email: "",
      password: "",
      password2: "",
    });
    navigate("/login");
  };
  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={onSubmit}>
        <h2>Create Account</h2>
        <Input
          label={"Full Name"}
          id={"name"}
          placeholder={"Enter your full name"}
          value={name}
          onChange={onChange}
          required
        />
        <Input
          label={"Email"}
          id={"email"}
          placeholder={"Enter your email"}
          value={email}
          onChange={onChange}
          required
        />
        <Input
          label={"Password"}
          id={"password"}
          placeholder={"Enter your password"}
          value={password}
          onChange={onChange}
          type="password"
          required
        />
        <Input
          label={"Confirm Password"}
          id={"password2"}
          placeholder={"Confirm your password"}
          value={password2}
          onChange={onChange}
          type="password"
          required
        />
        <Button type="submit" variant="primary" fullWidth>Register</Button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
