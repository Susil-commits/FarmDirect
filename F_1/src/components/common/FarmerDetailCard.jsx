import React from 'react';
import { CheckCircle, Mail, MapPin, Eye, MessageSquare, User } from 'lucide-react';
import Avatar from './Avatar';
import Button from './Button';

/**
 * FarmerDetailCard Component
 * Large detailed display of farmer info for crop detail page
 * Shows: photo, name, stats, bio, certifications, action buttons
 */
export default function FarmerDetailCard({ 
  farmer,
  onViewProfile = null,
  onMessage = null,
  onViewAllProducts = null
}) {
  if (!farmer) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <p className="text-gray-500 text-center">Farmer information not available</p>
      </div>
    );
  }

  // Extract farmer data (handle both string and object formats)
  const farmerName = typeof farmer === 'string' ? farmer : (farmer.name || 'Local Farmer');
  const farmerData = typeof farmer === 'object' ? farmer : { name: farmer };
  const isVerified = farmerData.verified || farmerData.farmer_verified;

  return (
    <div className="border border-green-200 rounded-lg p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Farmer Title */}
      <div className="mb-4 pb-4 border-b border-green-200">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Sold By</h3>
      </div>

      {/* Main Farmer Section */}
      <div className="flex flex-col items-center text-center mb-6">
        {/* Avatar */}
        <div className="mb-4">
          <Avatar 
            user={farmerData} 
            size="lg" 
            className="border-4 border-white shadow-md"
          />
        </div>

        {/* Farmer Name with Verified Badge */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{farmerName}</h2>
          {isVerified && (
            <CheckCircle size={24} className="text-green-600 animate-pulse-soft" />
          )}
        </div>

        {/* Verified Badge Text */}
        {isVerified && (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-3">
            ✓ Verified Farmer
          </span>
        )}

        {/* Location */}
        {farmerData.location && (
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
            <MapPin size={16} className="text-green-600" />
            <span className="text-sm">{farmerData.location}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-green-200">
        {/* Stat: Member Since */}
        <div className="text-center">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Member Since</p>
          <p className="text-sm font-bold text-gray-900">
            {farmerData.joinedDate || 'Jan 2023'}
          </p>
        </div>

        {/* Stat: Total Sales */}
        <div className="text-center">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Total Sales</p>
          <p className="text-sm font-bold text-gray-900">
            {farmerData.totalSales || '245'}
          </p>
        </div>

        {/* Stat: Listings */}
        <div className="text-center">
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Active Listings</p>
          <p className="text-sm font-bold text-gray-900">
            {farmerData.totalListings || '12'}
          </p>
        </div>
      </div>

      {/* Rating Section */}
      <div className="mb-6 pb-6 border-b border-green-200">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">⭐</span>
          <span className="text-2xl font-bold text-amber-500">{farmerData.rating || '4.8'}</span>
          <span className="text-gray-600 font-medium">
            from {farmerData.reviewCount || '234'} reviews
          </span>
        </div>
      </div>

      {/* Bio Section */}
      {farmerData.bio && (
        <div className="mb-6 pb-6 border-b border-green-200">
          <p className="text-sm text-gray-700 italic leading-relaxed">
            "{farmerData.bio}"
          </p>
        </div>
      )}

      {/* Certifications/Badges */}
      {farmerData.certifications && farmerData.certifications.length > 0 && (
        <div className="mb-6 pb-6 border-b border-green-200">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Certifications</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {farmerData.certifications.map((cert, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold"
              >
                🏆 {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full flex items-center justify-center gap-2"
          onClick={onViewAllProducts}
        >
          <Eye size={16} /> View All Products
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center gap-2"
          onClick={onMessage}
        >
          <MessageSquare size={16} /> Message Farmer
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center gap-2"
          onClick={onViewProfile}
        >
          <User size={16} /> View Profile
        </Button>
      </div>

      {/* Footer: Email Icon (Optional) */}
      {farmerData.email && (
        <div className="text-center mt-4 pt-4 border-t border-green-200">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Mail size={12} /> {farmerData.email}
          </p>
        </div>
      )}
    </div>
  );
}
