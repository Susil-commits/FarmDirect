import { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageTransition from '../../components/common/PageTransition.jsx';

export default function GoogleCallback() {
  const { navigate } = useRouter();
  const { googleLogin, user, redirectPath, clearRedirectPath } = useAuth();
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          addToast(`Google login failed: ${error}`, 'error');
          navigate('/auth/login');
          return;
        }

        if (!code) {
          addToast('No authorization code received', 'error');
          navigate('/auth/login');
          return;
        }

        // Exchange code for token via backend
        await googleLogin(code);

        addToast('Google login successful!', 'success');

        // Redirect based on user role or redirect path
        setTimeout(() => {
          if (redirectPath) {
            clearRedirectPath();
            navigate(redirectPath);
          } else if (user?.role === 'farmer') {
            navigate('/farmer/dashboard');
          } else if (user?.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/marketplace');
          }
        }, 1000);
      } catch (error) {
        console.error('Google callback error:', error);
        addToast(error?.message || 'Google login failed', 'error');
        navigate('/auth/login');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1">
                <animate attributeName="r" values="1;3;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Google Login</h2>
          <p className="text-gray-600">Please wait while we verify your credentials...</p>
        </div>
      </div>
    </PageTransition>
  );
}

