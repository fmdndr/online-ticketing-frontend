import React from 'react';

export const Input = ({ label, className = '', ...props }) => {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && <label className="text-sm font-retina text-on-surface-variant">{label}</label>}
      <input 
        className="px-4 py-3 bg-surface-container-high rounded text-on-surface placeholder-on-surface-variant transition-all duration-200 focus:outline-none focus:bg-surface-container-lowest focus:ring-[2px] focus:ring-primary/20"
        {...props}
      />
    </div>
  );
};
