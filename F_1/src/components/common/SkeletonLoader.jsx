import React from 'react';

export default function SkeletonLoader({ variant = 'page', count = 1 }) {
  const pulseClass = "animate-pulse bg-gray-200 rounded";

  if (variant === 'marketplace') {
    return (
      <div className="min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="flex justify-between items-center mb-8 mt-4">
          <div className={`${pulseClass} h-12 w-64`}></div>
          <div className={`${pulseClass} h-10 w-24 hidden lg:block`}></div>
        </div>
        <div className="flex gap-2 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${pulseClass} h-10 w-24 rounded-full`}></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`${pulseClass} hidden lg:block h-96 rounded-xl`}></div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className={`${pulseClass} h-48 rounded-none`}></div>
                <div className="p-5 space-y-3">
                  <div className={`${pulseClass} h-5 w-3/4`}></div>
                  <div className={`${pulseClass} h-4 w-1/2`}></div>
                  <div className={`${pulseClass} h-10 w-full mt-4 rounded-xl`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 w-full">
        <div className="max-w-6xl mx-auto">
          <div className={`${pulseClass} h-6 w-32 mb-6`}></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className={`${pulseClass} h-[400px] w-full rounded-2xl`}></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${pulseClass} h-32 w-full rounded-2xl`}></div>
                <div className={`${pulseClass} h-32 w-full rounded-2xl`}></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className={`${pulseClass} h-64 w-full rounded-2xl`}></div>
              <div className={`${pulseClass} h-48 w-full rounded-2xl`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className={`${pulseClass} h-12 w-64 mb-8`}></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`${pulseClass} h-32 w-full rounded-2xl`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
             <div className={`${pulseClass} lg:col-span-2 h-96 w-full rounded-2xl`}></div>
             <div className={`${pulseClass} h-96 w-full rounded-2xl`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card-grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {[...Array(count || 4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className={`${pulseClass} h-48 rounded-none`}></div>
            <div className="p-5 space-y-3">
              <div className={`${pulseClass} h-5 w-3/4`}></div>
              <div className={`${pulseClass} h-4 w-1/2`}></div>
              <div className={`${pulseClass} h-10 w-full mt-4 rounded-xl`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4 w-full">
        {[...Array(count || 3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex gap-4 items-center border border-gray-100">
            <div className={`${pulseClass} h-16 w-16 rounded-lg`}></div>
            <div className="flex-1 space-y-2">
              <div className={`${pulseClass} h-5 w-1/3`}></div>
              <div className={`${pulseClass} h-4 w-1/4`}></div>
            </div>
            <div className={`${pulseClass} h-8 w-24 rounded-lg hidden sm:block`}></div>
          </div>
        ))}
      </div>
    );
  }

  // Default 'page' variant
  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className={`${pulseClass} h-12 w-64 mb-8`}></div>
        <div className={`${pulseClass} h-64 w-full rounded-2xl`}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${pulseClass} h-48 w-full rounded-2xl`}></div>
          <div className={`${pulseClass} h-48 w-full rounded-2xl`}></div>
        </div>
      </div>
    </div>
  );
}
