// src/components/common/Select.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './common.css'; // Assuming common form styles are here or import specific CSS

const Select = ({ id, label, value, onChange, name, options = [], required, className = '', placeholder, ...rest }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id}>{label}{required && <span className="required-asterisk">*</span>}</label>}
      <div className="select-wrapper"> {/* Wrapper for custom arrow */}
        <select
          id={id}
          name={name || id} // Default name to id if not provided
          value={value}
          onChange={onChange}
          required={required}
          className="select-field" // Base class for styling
          {...rest} // Pass down any other standard select attributes
        >
          {/* Optional placeholder/default option */}
          {placeholder && <option value="" disabled>{placeholder}</option>}

          {/* Map over the provided options array */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
         {/* Custom arrow indicator can be added via CSS pseudo-element */}
      </div>
      {/* Add validation error display here if needed */}
    </div>
  );
};

Select.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

export default Select;