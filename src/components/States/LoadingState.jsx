import React from 'react';
import { SocraticPulse } from '../UI/SocraticPulse';

export const EventGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex flex-col p-4 -m-4 gap-4">
        <SocraticPulse className="w-full aspect-[4/3] shadow-ambient" />
        <SocraticPulse className="w-3/4 h-8" />
        <SocraticPulse className="w-1/2 h-5" />
      </div>
    ))}
  </div>
);
