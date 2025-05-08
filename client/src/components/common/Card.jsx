    // client/src/components/common/Card.jsx
    import React from 'react';
    import './Card.css'; // We will create this CSS file

    /**
     * A simple reusable Card component that acts as a styled container.
     * @param {object} props - Component props
     * @param {React.ReactNode} props.children - Content to be rendered inside the card
     * @param {string} [props.className] - Optional additional CSS classes
     */
    const Card = ({ children, className = '', ...props }) => {
      // Combine the base 'card' class with any additional classes passed in
      const cardClassName = `card ${className}`.trim();

      return (
        <div className={cardClassName} {...props}>
          {children}
        </div>
      );
    };

    export default Card;
    