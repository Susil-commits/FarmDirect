import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

export const usePrivateRoute = (requiredRoles = null) => {
  const { user, isAuthenticated, hasRole, checkSession } = useAuth();
  const { navigate, _currentPath } = useRouter();

  useEffect(() => {
    const validateAccess = async () => {
      
      const sessionCheck = await checkSession();
      if (!sessionCheck.active) {
        console.warn('Session not active:', sessionCheck.reason);
        navigate('/auth/login');
        return;
      }

      if (!isAuthenticated) {
        navigate('/auth/login');
        return;
      }

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
