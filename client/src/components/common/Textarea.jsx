// src/components/common/Textarea.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './common.css'; // Assuming common form styles are here or import specific CSS

const Textarea = ({ id, label, value, onChange, name, rows = 4, placeholder, required, className = '', ...rest }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id}>{label}{required && <span className="required-asterisk">*</span>}</label>}
      <textarea
        id={id}
        name={name || id} // Default name to id if not provided
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="textarea-field" // Base class for styling
        {...rest} // Pass down any other standard textarea attributes
      />
      {/* Add validation error display here if needed */}
    </div>
  );
};

Textarea.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  rows: PropTypes.number,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
};

export default Textarea;