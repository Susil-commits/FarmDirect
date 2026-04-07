import { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, AlertCircle, FileText, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageTransition from '../../components/common/PageTransition.jsx';

export default function VerificationProgress() {
  const { user, verificationStatus, submitVerificationDocuments } = useAuth();
  const { navigate } = useRouter();
  const { addToast } = useToast();
  const [expandedSections, setExpandedSections] = useState({});
  const [documents, setDocuments] = useState({
    governmentId: { file: null, status: 'pending', fileName: '' },
    profilePhoto: { file: null, status: 'pending', fileName: '' },
    addressProof: { file: null, status: 'pending', fileName: '' },
    ...(user?.role === 'farmer' && {
      landOwnership: { file: null, status: 'pending', fileName: '' },
      farmRegistration: { file: null, status: 'pending', fileName: '' },
    })
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // If already verified, redirect to dashboard
    if (verificationStatus === 'verified') {
      addToast('Your account is verified! Redirecting to dashboard...', 'success');
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
          status: 'pending' // Mark as pending upload
        }
      }));
    }
  };

  const allDocumentsUploaded = Object.values(documents).every(doc => doc.file !== null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allDocumentsUploaded) {
      addToast('Please upload all required documents', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare form data with file uploads
      const formData = new FormData();
      Object.entries(documents).forEach(([key, value]) => {
        if (value.file) {
          formData.append(key, value.file);
        }
      });

      const result = await submitVerificationDocuments(formData);
      setSubmittedAt(new Date());
      addToast('Documents submitted successfully for verification!', 'success');
    } catch (error) {
      console.error('Submission error:', error);
      addToast(error?.message || 'Failed to submit documents. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-sky-50 to-cyan-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
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
                <div className="p-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg">
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
                <div className="p-6 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg">
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
                <div className="p-6 bg-linear-to-br from-orange-50 to-orange-100 rounded-lg">
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
          {verificationStatus !== 'verified' && (
            <Card className="bg-white shadow-lg">
              <form onSubmit={handleSubmit} className="p-8">
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
                        className="w-full p-4 bg-linear-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition flex items-center justify-between border border-gray-200"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <span className="text-2xl">{doc.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{doc.label}</h3>
                            <p className="text-sm text-gray-600">{doc.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {documents[doc.id]?.file ? (
                            <Badge label="Uploaded" variant="success" />
                          ) : (
                            <Badge label="Pending" variant="warning" />
                          )}
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
                    onClick={() => navigate('/auth/login')}
                  >
                    Save & Continue Later
                  </Button>
                </div>

                {submittedAt && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Documents submitted on {submittedAt.toLocaleString()}. Admin will review within 24-48 hours.
                    </p>
                  </div>
                )}
              </form>
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
                  if (user?.role === 'farmer') {
                    navigate('/farmer/dashboard');
                  } else if (user?.role === 'buyer') {
                    navigate('/marketplace');
                  } else {
                    navigate('/');
                  }
                }}
              >
                Go to Dashboard
              </Button>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
