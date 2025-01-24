import React from 'react';
import './Button.css';

const Button = ({ children, onClick, disabled, type = 'button' }) => {
  return (
    <button 
      className="custom-button" 
      onClick={onClick} 
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
