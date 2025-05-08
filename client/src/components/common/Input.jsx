import React from 'react';
import './Input.css'; // Create this CSS file

const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || undefined;

  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <input
        type={type}
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="input-field"
        {...props}
      />
      {/* Add error message display later */}
    </div>
  );
};

export default Input;