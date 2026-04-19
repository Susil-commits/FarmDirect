import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export const useAuthCheck = (requiredRole = null) => {
  const { user, loading } = useAuth();
  
  const isAuthenticated = !!user;
  const hasRequiredRole = !requiredRole || (user && user.role === requiredRole);
  
  return {
    isAuthenticated,
    hasRequiredRole,
    loading,
    canAccess: isAuthenticated && hasRequiredRole
  };
};
