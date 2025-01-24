import React from 'react';
import './Input.css';

const Input = ({ value, onChange, placeholder, type = 'text', ...props }) => {
  return (
    <input
      className="custom-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default Input;
