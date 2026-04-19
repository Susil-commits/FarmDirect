import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

/**
 * Custom hook to handle logout with confirmation modal
 * Usage: const { logout, showConfirmation, handleConfirm, handleCancel } = useLogoutWithConfirmation();
 */
export const useLogoutWithConfirmation = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { logout: authLogout } = useAuth();
  const { navigate } = useRouter();

  const handleLogout = useCallback(() => {
    setShowConfirmation(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    setShowConfirmation(false);
    await authLogout();
    navigate('/');
  }, [authLogout, navigate]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  return {
    showConfirmation,
    logout: handleLogout,
    handleConfirm,
    handleCancel,
  };
};

export default useLogoutWithConfirmation;
