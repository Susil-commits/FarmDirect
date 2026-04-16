import React from 'react';
import { CheckCircle } from 'lucide-react';
import Avatar from './Avatar';

/**
 * FarmerBadge Component
 * Compact display of farmer info for crop cards and listings
 * Shows: farmer avatar, name, verified badge
 */
export default function FarmerBadge({ 
  farmer, 
  compact = true,
  showVerified = true,
  onClick = null
}) {
  if (!farmer) {
    return (
      <div className="text-gray-500 text-sm">
        <p>👨‍🌾 Local Farmer</p>
      </div>
    );
  }

  // Extract farmer data (handle both string and object formats)
  const farmerName = typeof farmer === 'string' ? farmer : (farmer.name || 'Local Farmer');
  const farmerData = typeof farmer === 'object' ? farmer : { name: farmer };
  const isVerified = farmerData.verified || farmerData.farmer_verified;

  if (compact) {
    // Compact version for crop cards
    return (
      <div 
        className="flex items-center gap-2 p-2 rounded bg-green-50 hover:bg-green-100 transition-colors cursor-pointer group"
        onClick={onClick}
      >
        <Avatar 
          user={farmerData} 
          size="sm" 
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {farmerName}
          </p>
          {isVerified && (
            <div className="flex items-center gap-0.5">
              <CheckCircle size={12} className="text-green-600" />
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version for detail pages
  return (
    <div 
      className="border border-green-200 rounded-lg p-3 bg-linear-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar 
          user={farmerData} 
          size="md" 
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900">{farmerName}</p>
            {isVerified && (
              <CheckCircle size={16} className="text-green-600" />
            )}
          </div>
          {farmerData.location && (
            <p className="text-sm text-gray-600">📍 {farmerData.location}</p>
          )}
          {farmerData.bio && (
            <p className="text-sm text-gray-700 mt-1">{farmerData.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}
