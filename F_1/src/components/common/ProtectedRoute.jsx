import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRouter } from '../../context/RouterContext.jsx';
import Card from './Card.jsx';

export const ProtectedRoute = ({ 
  children, 
  roles = null,
  requiredRoles = null, 
  requiredPermissions = null,
  requiredKYC = false,
  fallback = null,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, hasRole, hasPermission } = useAuth();
  const { navigate } = useRouter();
  const [_unauthorized, _setUnauthorized] = React.useState(false);

  const rolesToCheck = roles || requiredRoles;

  if (!isAuthenticated) {
    if (fallback) return fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <button
            onClick={() => navigate(redirectTo)}
            className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Login
          </button>
        </Card>
      </div>
    );
  }

  if (rolesToCheck && !hasRole(rolesToCheck)) {
    if (fallback) return fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
          <p className="text-gray-600 mb-4">
            Your role <span className="font-semibold capitalize">({user?.role})</span> is not authorized to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Required roles: <span className="font-semibold">
              {Array.isArray(rolesToCheck) ? rolesToCheck.join(', ') : rolesToCheck}
            </span>
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Return to Marketplace
          </button>
        </Card>
      </div>
    );
  }

  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    if (fallback) return fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Permission Denied</h1>
          <p className="text-gray-600 mb-6">You do not have the required permissions.</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Return to Marketplace
          </button>
        </Card>
      </div>
    );
  }

  if (requiredKYC && user?.role === 'farmer' && user?.kycStatus !== 'verified') {
    if (fallback) return fallback;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="p-12 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">KYC Verification Required</h1>
          <p className="text-gray-600 mb-4">
            Your account requires KYC verification to perform this action.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current status: <span className="font-semibold capitalize">
              {user?.kycStatus || 'pending'}
            </span>
          </p>
          <button
            onClick={() => navigate('/verification')}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-3"
          >
            Complete Verification
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Continue Browsing
          </button>
        </Card>
      </div>
    );
  }

  return children;
};

export function RoleBasedView({ children, roles, fallback = null }) {
  const { hasRole } = useAuth();

  if (!hasRole(roles)) {
    return fallback;
  }

  return children;
}

export function PermissionBasedView({ children, permission, fallback = null }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}

export function GuestOnly({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return fallback;
  }

  return children;
}

export function AuthenticatedOnly({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  return children;
}

export function KYCVerified({ children, fallback = null }) {
  const { user, isAuthenticated } = useAuth();

  const isFarmerVerified = isAuthenticated && user?.role === 'farmer' && user?.kycStatus === 'verified';
  
  if (!isFarmerVerified) {
    return fallback;
  }

  return children;
}

export function AuthLoading({ children, fallback = null }) {
  const { loading } = useAuth();

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
