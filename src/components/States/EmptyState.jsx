import React from 'react';
import { Button } from '../UI/Button';
import { useNavigate } from 'react-router-dom';

export const EmptyState = ({ message = "No active drops at this moment.", actionText = "Browse the Calendar", actionPath = "/" }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-container-low rounded mt-8">
      <div className="w-16 h-16 bg-surface-container-lowest rounded-full shadow-ambient flex items-center justify-center mb-6">
        <span className="text-2xl text-on-surface-variant">✦</span>
      </div>
      <h3 className="text-3xl font-extrabold tracking-tightest mb-3 text-on-surface">Zero Results</h3>
      <p className="text-on-surface-variant max-w-md mb-8 font-retina leading-relaxed">{message}</p>
      {actionText && <Button variant="secondary" onClick={() => navigate(actionPath)}>{actionText}</Button>}
    </div>
  );
};
