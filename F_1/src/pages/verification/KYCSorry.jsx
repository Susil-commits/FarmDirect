import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { adminService, authServiceExtended } from '../../services/appService';
import PageTransition from '../../components/common/PageTransition';
import { XCircle, Trash2, Upload, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function KYCSorry() {
  const { user, setUser, logout } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const markedRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const rejectionReason = user?.kycRejectionReason || 'No specific reason provided.';

  useEffect(() => {
    // Mark KYC result as seen so this page doesn't show again
    if (!markedRef.current && user) {
      markedRef.current = true;
      adminService.markKYCResultSeen().then(() => {
        if (setUser) {
          setUser({ ...user, kycResultSeen: true });
        }
      }).catch(err => {
        console.error('Failed to mark KYC result as seen:', err);
      });
    }
  }, [user, setUser]);

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await authServiceExtended.deleteAccount();
      // Logout and redirect to home
      if (logout) {
        await logout();
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      addToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleResubmit = () => {
    navigate('/verification/progress');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-5 sm:px-8 py-10 sm:py-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                <XCircle size={56} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                We're Sorry
              </h1>
              <p className="text-red-100 text-lg font-medium">
                Your KYC verification was not approved
              </p>
            </div>

            {/* Content */}
            <div className="px-5 sm:px-8 py-8 sm:py-10">
              {/* Rejection Reason */}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 mb-8 border border-red-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800 mb-2">
                      Rejection Reason
                    </h3>
                    <p className="text-red-700 leading-relaxed">
                      {rejectionReason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  What would you like to do?
                </h3>
                <div className="space-y-4">
                  {/* Option 1: Re-submit */}
                  <button
                    onClick={handleResubmit}
                    className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Upload size={24} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-lg font-bold text-blue-800">Re-submit Documents</h4>
                      <p className="text-blue-600 text-sm">
                        Review the rejection reason, update your documents, and submit again for verification
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Delete Account */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 group-hover:scale-110 transition-all">
                      <Trash2 size={24} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-lg font-bold text-gray-700 group-hover:text-red-700 transition-colors">Delete My Account</h4>
                      <p className="text-gray-500 text-sm group-hover:text-red-500 transition-colors">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Go Home */}
              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
              >
                <ArrowLeft size={20} />
                Return to Home
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Need help? Contact our support team for assistance with your verification.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-gray-600">
                This action is permanent and cannot be undone. All your data, including documents, orders, and listings will be permanently deleted.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}