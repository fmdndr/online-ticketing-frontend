import React from 'react';
import { Button } from '../UI/Button';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ErrorState = ({ 
  title = "Connection Interrupted",
  message = "We lost the link to the ledger. Your place in the queue is currently held securely.", 
  errorCode,
  sessionId,
  timestamp,
  onRetry 
}) => {
  const navigate = useNavigate();
  const hasDetails = errorCode || sessionId || timestamp;

  return (
    <div className="flex flex-col items-start max-w-2xl w-full relative z-10 mx-auto py-12">
      <div className="bg-[#ffeceb] text-[#c20038] rounded-md w-12 h-12 flex items-center justify-center mb-6">
        <AlertTriangle size={24} />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tightest text-on-surface mb-3">{title}</h1>
      <p className="text-on-surface-variant font-retina text-lg mb-10 max-w-xl">{message}</p>

      {hasDetails && (
        <div className="relative w-full mb-10 flex justify-center items-center">
          <div className="absolute w-64 h-64 bg-surface-container-high rounded-full opacity-40 -z-10"></div>
          <div className="absolute w-16 h-64 bg-surface opacity-60 -z-10"></div>
          <div className="absolute w-64 h-16 bg-surface opacity-60 -z-10"></div>
          
          <div className="bg-surface-container-low rounded-xl p-8 w-full z-10 relative">
            {sessionId && (
              <div className="flex justify-between items-center mb-6">
                <span className="text-on-surface-variant font-retina">Session ID</span>
                <span className="font-mono text-sm font-bold text-on-surface">{sessionId}</span>
              </div>
            )}
            {errorCode && (
              <div className={`flex justify-between items-center ${timestamp ? 'mb-6' : ''}`}>
                <span className="text-on-surface-variant font-retina">Error Code</span>
                <span className="font-mono text-xs font-bold bg-[#ffeceb] text-[#c20038] px-2 py-1 rounded tracking-wider uppercase">{errorCode}</span>
              </div>
            )}
            {timestamp && (
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-retina">Timestamp</span>
                <span className="font-mono text-sm font-bold text-on-surface">{timestamp}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={() => navigate('/')} className="flex items-center gap-2 px-6">
          Return to Events <ArrowRight size={18} />
        </Button>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} className="px-6">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};
