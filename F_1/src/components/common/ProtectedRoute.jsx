import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

/**
 * ProtectedRoute Component
 * Restricts access based on authentication and role requirements
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRoles = null,
  requiredPermissions = null,
  fallback = null,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, hasRole, hasPermission } = useAuth();
  const { navigate } = useRouter();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    React.useEffect(() => {
      navigate(redirectTo);
    }, []);
    return fallback || null;
  }

  // Role check
  if (requiredRoles && !hasRole(requiredRoles)) {
    console.warn(`User role '${user?.role}' does not match required roles:`, requiredRoles);
    React.useEffect(() => {
      navigate('/unauthorized');
    }, []);
    return fallback || null;
  }

  // Permission check
  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    console.warn(`User does not have required permissions:`, requiredPermissions);
    React.useEffect(() => {
      navigate('/forbidden');
    }, []);
    return fallback || null;
  }

  return children;
};

export default ProtectedRoute;
