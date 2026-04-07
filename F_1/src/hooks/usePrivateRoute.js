import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

/**
 * Hook for protecting routes programmatically
 * Redirects to login if not authenticated
 * Optionally checks for required roles
 */
export const usePrivateRoute = (requiredRoles = null) => {
  const { user, isAuthenticated, hasRole, checkSession } = useAuth();
  const { navigate, currentPath } = useRouter();

  useEffect(() => {
    const validateAccess = async () => {
      // Check if session is still valid
      const sessionCheck = await checkSession();
      if (!sessionCheck.active) {
        console.warn('Session not active:', sessionCheck.reason);
        navigate('/auth/login');
        return;
      }

      // Check authentication
      if (!isAuthenticated) {
        navigate('/auth/login');
        return;
      }

      // Check roles if specified
      if (requiredRoles) {
        if (!hasRole(requiredRoles)) {
          console.warn(`Access denied. Required roles:`, requiredRoles);
          navigate('/unauthorized');
          return;
        }
      }
    };

    validateAccess();
  }, [isAuthenticated, requiredRoles, navigate, checkSession, hasRole]);

  return {
    isAuthenticated,
    user,
    hasRequiredRole: requiredRoles ? hasRole(requiredRoles) : true,
  };
};

export default usePrivateRoute;
