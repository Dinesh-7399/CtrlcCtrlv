import React from 'react';
import './Button.css'; // Create this CSS file

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  fullWidth = false,
  className = '', // Allow custom classes
  ...props // Pass other props like aria-label
}) => {
  const classes = `btn btn-<span class="math-inline">\{variant\} btn\-</span>{size} ${fullWidth ? 'btn-fullwidth' : ''} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;