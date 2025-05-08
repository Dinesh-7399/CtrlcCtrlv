// client/src/components/common/Spinner.jsx
import React from 'react';
import './Spinner.css'; // We will create this CSS file

/**
 * A simple CSS-based loading spinner component.
 * @param {object} props - Component props
 * @param {string} [props.size='medium'] - Size of the spinner ('small', 'medium', 'large')
 * @param {string} [props.className] - Optional additional CSS classes
 */
const Spinner = ({ size = 'medium', className = '', ...props }) => {
  const spinnerClassName = `loading-spinner spinner-${size} ${className}`.trim();

  return (
    <div className={spinnerClassName} role="status" aria-live="polite" {...props}>
      <span className="visually-hidden">Loading...</span> {/* Accessible text */}
    </div>
  );
};

// Utility class for visually hidden elements (can be global)
// If not already defined globally, add this style to Spinner.css or index.css
/*
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
*/

export default Spinner;