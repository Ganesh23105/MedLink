import React from "react";

export const Button = ({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  disabled, 
  className = "",
  ...props 
}) => {
  const baseStyles = "px-6 py-3 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg focus:ring-primary-500",
    secondary: "bg-secondary-500 hover:bg-secondary-600 text-white shadow-md hover:shadow-lg focus:ring-secondary-500",
    outline: "bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
    danger: "bg-danger-500 hover:bg-danger-600 text-white shadow-md hover:shadow-lg focus:ring-danger-500",
  };

  const variantStyles = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
