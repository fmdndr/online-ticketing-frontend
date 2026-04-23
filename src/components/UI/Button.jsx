import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "relative inline-flex items-center justify-center rounded px-6 py-3 transition-all duration-200 font-sans font-retina active:scale-98 hover:scale-102 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-primary hover:shadow-ambient",
    secondary: "bg-surface-container-highest text-on-surface",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
