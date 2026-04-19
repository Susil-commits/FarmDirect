import { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, AlertCircle, FileText, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import BackButton from '../../components/common/BackButton';
import CongratulationModal from '../../components/common/CongratulationModal';
import PageTransition from '../../components/common/PageTransition.jsx';

export default function VerificationProgress() {
  const { user, verificationStatus, submitVerificationDocuments, fetchVerificationStatus } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const [expandedSections, setExpandedSections] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  
  const [documents, setDocuments] = useState(() => {
    const baseDocuments = {
      governmentId: { file: null, status: 'pending', fileName: '' },
      profilePhoto: { file: null, status: 'pending', fileName: '' },
      addressProof: { file: null, status: 'pending', fileName: '' },
      ...(user?.role === 'farmer' && {
        landOwnership: { file: null, status: 'pending', fileName: '' },
        farmRegistration: { file: null, status: 'pending', fileName: '' },
      })
    };
    
    if (user?.id) {
      const stored = localStorage.getItem(`verificationDocuments_${user.id}`);
      if (stored) {
        try {
          const restored = JSON.parse(stored);
          return { ...baseDocuments, ...restored };
        } catch (err) {
          console.error('Failed to restore documents:', err);
        }
      }
    }
    
    return baseDocuments;
  });
  
  // Personal details state
  const [personalDetails, setPersonalDetails] = useState({
    aadharNumber: '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    pincode: user?.addresses?.[0]?.pincode || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(() => {
    // Restore submission state from localStorage on page load - user-specific
    if (!user?.id) return null;
    const stored = localStorage.getItem(`verificationSubmittedAt_${user.id}`);
    return stored ? new Date(stored) : null;
  });
  const [showCongratulation, setShowCongratulation] = useState(() => {
    // Check if we should show congratulation modal
    if (!user?.id) return false;
    const shouldShow = localStorage.getItem(`showCongratulation_${user.id}`);
    return !!shouldShow;
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Save documents metadata to localStorage whenever they change
  useEffect(() => {
    if (user?.id) {
      const toStore = {};
      Object.entries(documents).forEach(([key, doc]) => {
        toStore[key] = {
          status: doc.status || 'pending',
          fileName: doc.fileName || '',
          file: doc.file ? doc.file.name : null
        };
      });
      localStorage.setItem(`verificationDocuments_${user.id}`, JSON.stringify(toStore));
    }
  }, [documents, user?.id]);

  // Check verification status immediately on page load
  useEffect(() => {
    const checkStatus = async () => {
      if (user && verificationStatus === 'pending') {
        setIsChecking(true);
        await fetchVerificationStatus();
        setIsChecking(false);
      }
    };
    checkStatus();
  }, [user, verificationStatus, fetchVerificationStatus]);

  useEffect(() => {
    // If already verified, redirect to dashboard and clear submission state
    if (verificationStatus === 'verified') {
      // Clear user-specific submission state
      if (user?.id) {
        localStorage.removeItem(`verificationSubmittedAt_${user.id}`);
      }
      addToast('Your account has been verified! Redirecting to dashboard...', 'success');
      setTimeout(() => {
        if (user?.role === 'farmer') {
          navigate('/farmer/dashboard');
        } else if (user?.role === 'buyer') {
          navigate('/marketplace');
        } else {
          navigate('/');
        }
      }, 1000);
    }
  }, [verificationStatus, navigate, user, addToast]);

  const requiredDocuments = [
    {
      id: 'governmentId',
      label: 'Government ID (Aadhar/Passport/License)',
      description: 'Clear color copy of your government-issued identification',
      icon: '🆔',
      required: true,
    },
    {
      id: 'profilePhoto',
      label: 'Profile Photo',
      description: 'Recent passport-size photo (clear face, good lighting)',
      icon: '📸',
      required: true,
    },
    {
      id: 'addressProof',
      label: 'Address Proof',
      description: 'Electricity bill, water bill, or rental agreement (last 3 months)',
      icon: '🏠',
      required: true,
    },
    ...(user?.role === 'farmer' ? [
      {
        id: 'landOwnership',
        label: 'Land Ownership/Lease Document',
        description: 'Proof of land ownership or lease agreement',
        icon: '🏞️',
        required: true,
      },
      {
        id: 'farmRegistration',
        label: 'Farm Registration Certificate',
        description: 'Official farm registration or farming society membership',
        icon: '📜',
        required: true,
      },
    ] : []),
  ];

  const handleFileChange = (e, documentId) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
        return;
      }
      
      setDocuments(prev => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          file,
          fileName: file.name,
          status: 'ready' // Mark as ready for upload
        }
      }));
    }
  };

  const allDocumentsUploaded = Object.values(documents).every(doc => doc.file !== null);
  
  // Check if all documents have been submitted (persisted status)
  const allDocumentsSubmitted = Object.values(documents).every(doc => doc.status === 'submitted' && doc.fileName);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allDocumentsUploaded) {
      addToast('Please upload all required documents', 'error');
      return;
    }
    
    if (!personalDetails.aadharNumber || !personalDetails.city || !personalDetails.state || !personalDetails.pincode) {
      addToast('Please fill in all required personal details', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare form data with file uploads and personal details
      const formData = new FormData();
      Object.entries(documents).forEach(([key, value]) => {
        if (value.file) {
          formData.append(key, value.file);
        }
      });
      
      // Add personal details
      formData.append('aadharNumber', personalDetails.aadharNumber);
      formData.append('city', personalDetails.city);
      formData.append('state', personalDetails.state);
      formData.append('pincode', personalDetails.pincode);

      const _result = await submitVerificationDocuments(formData);
      const now = new Date();
      setSubmittedAt(now);
      
      // Update document status to submitted and persist
      const updatedDocs = {};
      Object.entries(documents).forEach(([key, doc]) => {
        updatedDocs[key] = {
          ...doc,
          status: 'submitted'
        };
      });
      setDocuments(updatedDocs);
      
      if (user?.id) {
        localStorage.setItem(`verificationSubmittedAt_${user.id}`, now.toISOString());
        localStorage.setItem(`verificationDocuments_${user.id}`, JSON.stringify(updatedDocs));
      }
      addToast('Documents submitted successfully for verification!', 'success');
    } catch (error) {
      console.error('Submission error:', error);
      addToast(error?.message || 'Failed to submit documents. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        addToast('Your account has been permanently deleted.', 'success');
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem(`verificationDocuments_${user?.id}`);
        localStorage.removeItem(`verificationSubmittedAt_${user?.id}`);
        localStorage.removeItem(`showCongratulation_${user?.id}`);
        // Redirect to home
        setTimeout(() => navigate('/'), 1500);
      } else {
        const data = await response.json();
        addToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      addToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Helper function to get display status for documents
  const getDocumentStatus = (doc) => {
    if (doc.status === 'submitted') return 'Submitted ✓';
    if (doc.status === 'ready' && doc.fileName) return 'Ready to Submit';
    if (doc.file) return 'Selected';
    return 'Pending Upload';
  };

  // Helper function to get badge variant
  const getDocumentBadgeVariant = (doc) => {
    if (doc.status === 'submitted') return 'success';
    if (doc.status === 'ready' || doc.file) return 'info';
    return 'warning';
  };

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected - Please resubmit';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Not Submitted';
    }
  };

  return (
    <PageTransition>
      {/* Show congratulation modal if verification just got approved */}
      {showCongratulation && <CongratulationModal />}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton label="Back" />
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Account Verification</h1>
            <p className="text-gray-600 text-lg">
              {user?.role === 'farmer'
                ? 'Complete your farmer verification to access the platform and start selling crops'
                : 'Complete your verification to place orders and access all features'}
            </p>
          </div>

          {/* Status Overview */}
          <Card className="mb-8 bg-white shadow-lg">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Current Status */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(verificationStatus)}
                    <h3 className="font-semibold text-gray-900">Current Status</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{getStatusText(verificationStatus)}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {verificationStatus === 'verified' && 'Your account is fully verified!'}
                    {verificationStatus === 'rejected' && 'Please resubmit your documents'}
                    {verificationStatus === 'pending' && 'Admin is reviewing your documents'}
                    {verificationStatus === null && 'Not yet submitted'}
                  </p>
                </div>

                {/* Documents Progress */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Documents</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(documents).filter(d => d.file !== null).length}/{requiredDocuments.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Documents uploaded</p>
                </div>

                {/* Timeline Info */}
                <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Timeline</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">24-48h</p>
                  <p className="text-sm text-gray-600 mt-2">Approval time</p>
                </div>
              </div>



              {/* Timeline Progress */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Verification Timeline</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Registration Complete</p>
                      <p className="text-sm text-gray-600">You've successfully created your account</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${allDocumentsUploaded ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {allDocumentsUploaded ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-bold text-sm">2</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Document Submission</p>
                      <p className="text-sm text-gray-600">Submit required documents for verification</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${verificationStatus === 'verified' ? 'bg-green-500' : verificationStatus === 'pending' ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      {verificationStatus === 'verified' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : verificationStatus === 'pending' ? (
                        <Clock className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-bold text-sm">3</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Admin Review</p>
                      <p className="text-sm text-gray-600">Our admin team reviews your documents (24-48 hours)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${verificationStatus === 'verified' ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {verificationStatus === 'verified' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-bold text-sm">4</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Full Access</p>
                      <p className="text-sm text-gray-600">Once approved, enjoy full access to the platform</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents Section */}
          {verificationStatus !== 'verified' && (!allDocumentsSubmitted || verificationStatus === 'rejected') && (
            <Card className="bg-white shadow-lg">
              <form onSubmit={handleSubmit} className="p-8">
                {/* Rejection Notice */}
                {verificationStatus === 'rejected' && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 inline mr-2" />
                    <p className="text-red-800 font-medium">
                      Your documents were rejected. Please resubmit with the corrections.
                    </p>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Required Documents
                </h2>

                <div className="space-y-4 mb-8">
                  {requiredDocuments.map(doc => (
                    <div key={doc.id}>
                      <button
                        type="button"
                        onClick={() => toggleSection(doc.id)}
                        className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition flex items-center justify-between border border-gray-200"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <span className="text-2xl">{doc.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{doc.label}</h3>
                            <p className="text-sm text-gray-600">{doc.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            label={getDocumentStatus(documents[doc.id])} 
                            variant={getDocumentBadgeVariant(documents[doc.id])}
                          />
                          {expandedSections[doc.id] ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </button>

                      {expandedSections[doc.id] && (
                        <div className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                          <label className="block mb-4">
                            <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-gray-700">
                                  {documents[doc.id]?.fileName || 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, or PDF up to 5MB</p>
                              </div>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,application/pdf"
                                onChange={(e) => handleFileChange(e, doc.id)}
                                className="hidden"
                              />
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Important Notes */}
                <Card className="bg-blue-50 border border-blue-200 mb-8">
                  <div className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Important Guidelines
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>✓ All documents must be clear and readable</li>
                      <li>✓ Documents should not be blurred or faded</li>
                      <li>✓ All information must match your registration details</li>
                      <li>✓ Original documents are required (colored copies)</li>
                      <li>✓ Maximum file size is 5MB per document</li>
                      <li>✓ Approved formats: PDF, JPG, PNG</li>
                    </ul>
                  </div>
                </Card>

                {/* Personal Details Section */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Aadhar Number *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter 12-digit Aadhar number"
                          value={personalDetails.aadharNumber}
                          onChange={(e) => setPersonalDetails({...personalDetails, aadharNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter city name"
                          value={personalDetails.city}
                          onChange={(e) => setPersonalDetails({...personalDetails, city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter state name"
                          value={personalDetails.state}
                          onChange={(e) => setPersonalDetails({...personalDetails, state: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter 6-digit pincode"
                          value={personalDetails.pincode}
                          onChange={(e) => setPersonalDetails({...personalDetails, pincode: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    disabled={!allDocumentsUploaded || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      // Save submission state even though user hasn't fully submitted
                      const now = new Date();
                      if (user?.id) {
                        localStorage.setItem(`verificationSubmittedAt_${user.id}`, now.toISOString());
                      }
                      addToast('Your progress has been saved. You can continue later.', 'success');
                      // Navigate to appropriate dashboard
                      if (user?.role === 'farmer') {
                        navigate('/farmer/dashboard');
                      } else if (user?.role === 'buyer') {
                        navigate('/buyer/dashboard');
                      } else {
                        navigate('/');
                      }
                    }}
                  >
                    Save & Continue Later
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* KYC Rejected - Delete Account Option */}
          {verificationStatus === 'rejected' && (
            <Card className="bg-red-50 border border-red-200 p-12 text-center mb-8">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-red-900 mb-3">Application Rejected</h2>
              <p className="text-red-800 mb-6">
                Unfortunately, your KYC application has been rejected. You can resubmit your documents or delete your account.
              </p>
              {user?.kycRejectionReason && (
                <div className="bg-white p-6 rounded-lg border border-red-200 mb-6 text-left">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Reason for Rejection:</p>
                  <p className="text-gray-900">{user.kycRejectionReason}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  className="px-6"
                >
                  Resubmit Documents
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6"
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          )}

          {/* Documents Submitted - Awaiting Review */}
          {verificationStatus !== 'verified' && allDocumentsSubmitted && verificationStatus !== 'rejected' && (
            <Card className="bg-blue-50 border border-blue-200 p-12 text-center">
              <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-blue-900 mb-3">Documents Under Review</h2>
              <p className="text-blue-800 mb-6">
                Your documents have been successfully submitted. Our team is reviewing your submission. This usually takes 2-3 business days.
              </p>
              {submittedAt && (
                <p className="text-sm text-blue-700 mb-6">
                  Submitted on: {new Date(submittedAt).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {requiredDocuments.map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{doc.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{doc.label}</p>
                        <Badge 
                          label={getDocumentStatus(documents[doc.id])} 
                          variant={getDocumentBadgeVariant(documents[doc.id])}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-blue-700 mb-6">
                You will receive an email notification once your account is verified or if resubmission is needed.
              </p>
            </Card>
          )}

          {/* Verified Message */}
          {verificationStatus === 'verified' && (
            <Card className="bg-green-50 border border-green-200 text-center p-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-900 mb-3">Account Verified!</h2>
              <p className="text-green-800 mb-6">
                Congratulations! Your account has been verified. You now have full access to the platform.
              </p>
              <Button
                variant="success"
                size="lg"
                onClick={() => {
                  navigate('/');
                }}
              >
                Go to Home
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including orders, crops, and wishlist.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
