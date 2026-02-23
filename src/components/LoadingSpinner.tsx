import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="relative">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-rose-200 border-t-rose-500"></div>
    </div>
  </div>
);
