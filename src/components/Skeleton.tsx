import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};

export const ServiceSkeleton: React.FC = () => {
  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <Skeleton className="w-16 h-16 rounded-lg mr-4" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  );
};
