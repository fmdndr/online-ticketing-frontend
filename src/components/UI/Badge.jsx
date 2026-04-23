import React from 'react';

export const Badge = ({ children, variant = 'urgency' }) => {
  const variants = {
    urgency: "bg-tertiary-container text-on-tertiary-fixed",
    available: "bg-secondary text-white",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};
