import React from 'react';

/**
 * Avatar Component
 * Displays user profile photo or first letter of email as fallback
 * Used throughout app for identity verification
 */
export default function Avatar({ 
  user, 
  size = 'md', 
  className = '',
  showBadge = false,
  badge = null 
}) {
  // Size mappings
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  // Get user's initial from name (first letter of first name)
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Generate color based on user name (consistent color for same user)
  const getColorClass = () => {
    const identifier = user?.name || user?.firstName || user?.email || 'user';
    if (!identifier) return 'bg-gray-500';
    
    const colors = [
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-red-500',
    ];
    
    // Use identifier's first character code to pick color
    const charCode = identifier.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // If user has photo, display it
  if (user?.photo) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={user.photo}
          alt={user.name || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 hover:border-green-400 transition-all`}
        />
        {showBadge && badge && (
          <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">
            {badge}
          </div>
        )}
      </div>
    );
  }

  // Fallback: show initial with email-based color
  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} ${getColorClass()} rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-100 hover:border-green-400 transition-all`}
        title={user?.name || 'User'}
      >
        {getInitial()}
      </div>
      {showBadge && badge && (
        <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">
          {badge}
        </div>
      )}
    </div>
  );
}
