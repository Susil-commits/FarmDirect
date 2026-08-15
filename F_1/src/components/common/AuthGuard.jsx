
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

const withAuthGuard = (
  Component,
  options = {}
) => {
  const {
    requiredRoles = null,
    requiredPermissions = null,
    requireVerification = false,
    redirectTo = '/login',
    fallbackComponent = null,
  } = options;

  return function ProtectedComponent(props) {
    const { 
      isAuthenticated, 
      hasRole, 
      hasPermission, 
      verificationStatus,
      checkSession 
    } = useAuth();
    const { navigate } = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const validateAccess = useCallback(async () => {
      try {
        
        const session = await checkSession();
        if (!session.active) {
          navigate(redirectTo);
          return;
        }

        if (!isAuthenticated) {
          navigate(redirectTo);
          setLoading(false);
          return;
        }

        if (requiredRoles && !hasRole(requiredRoles)) {
          navigate('/unauthorized');
          setLoading(false);
          return;
        }

        if (requiredPermissions && !hasPermission(requiredPermissions)) {
          navigate('/forbidden');
          setLoading(false);
          return;
        }

        if (requireVerification && verificationStatus !== 'verified') {
          navigate('/verification/progress');
          setLoading(false);
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth guard validation error:', error);
        navigate(redirectTo);
      } finally {
        setLoading(false);
      }
       
    }, [isAuthenticated, hasRole, hasPermission, checkSession, navigate, requiredRoles, requiredPermissions, requireVerification, verificationStatus, redirectTo]);

    useEffect(() => {
      validateAccess();
    }, [validateAccess]);

    if (loading) {
      return fallbackComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating access...</p>
          </div>
        </div>
      );
    }

    if (!authorized) {
      return fallbackComponent || null;
    }

    return <Component {...props} />;
  };
};

export default withAuthGuard;

export const RoleBadge = ({ className = '' }) => {
  const { user } = useAuth();

  if (!user) return null;

  const roleColors = {
    buyer: 'bg-blue-100 text-blue-800',
    farmer: 'bg-green-100 text-green-800',
    admin: 'bg-red-100 text-red-800',
  };

  const roleEmojis = {
    buyer: '👤',
    farmer: '🌾',
    admin: '⚙️',
  };

  const roleClass = roleColors[user.role] || 'bg-gray-100 text-gray-800';
  const emoji = roleEmojis[user.role] || '';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleClass} ${className}`}>
      {emoji} {user.role}
    </span>
  );
};

export const VerificationBadge = ({ className = '' }) => {
  const { verificationStatus } = useAuth();

  if (!verificationStatus) return null;

  const statusColors = {
    verified: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusEmojis = {
    verified: '✓',
    pending: '⏳',
    rejected: '✗',
  };

  const statusClass = statusColors[verificationStatus] || 'bg-gray-100 text-gray-800';
  const emoji = statusEmojis[verificationStatus] || '';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusClass} ${className}`}>
      {emoji} {verificationStatus}
    </span>
  );
};

export const PermissionGate = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, user } = useAuth();

  if (!user || !hasPermission(permission)) {
    return fallback;
  }

  return children;
};

export const RoleGate = ({ 
  role, 
  children, 
  fallback = null 
}) => {
  const { hasRole, user } = useAuth();

  if (!user || !hasRole(role)) {
    return fallback;
  }

  return children;
};

export const VerificationGate = ({ 
  children, 
  fallback = null,
  requireVerified = true
}) => {
  const { verificationStatus } = useAuth();

  const isVerified = verificationStatus === 'verified';
  const shouldShow = requireVerified ? isVerified : !isVerified;

  return shouldShow ? children : fallback;
};
