import { useState } from 'react';
import { Upload, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import BackButton from '../../components/common/BackButton';
import uploadService from '../../services/uploadService';

export default function FarmerVerification() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [documents, setDocuments] = useState({
    governmentId: { file: null, status: 'pending', fileName: '' },
    landOwnership: { file: null, status: 'pending', fileName: '' },
    bankAccount: { file: null, status: 'pending', fileName: '' },
    farmRegistration: { file: null, status: 'pending', fileName: '' },
    landSurvey: { file: null, status: 'pending', fileName: '' },
  });

  const [submittedAt, setSubmittedAt] = useState(null);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Redirect non-farmers
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Access Denied: Only farmers can access this verification</p>
            <Button onClick={() => navigate('/')} variant="primary">
              Go To Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If already verified
  if (user?.verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verified Farmer</h1>
            <p className="text-gray-600 mb-6">Your account has been verified. You can now start selling!</p>
            <Button onClick={() => navigate('/farmer/dashboard')} variant="primary" className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const requiredDocs = [
    {
      id: 'governmentId',
      label: 'Government ID (Aadhar/Passport)',
      description: 'Clear copy of your government-issued ID',
      icon: '🆔',
    },
    {
      id: 'landOwnership',
      label: 'Land Ownership Proof',
      description: 'Document proving you own/lease the farmland',
      icon: '🏞️',
    },
    {
      id: 'bankAccount',
      label: 'Bank Account Document',
      description: 'Bank statement or passbook (first 2 pages)',
      icon: '🏦',
    },
    {
      id: 'farmRegistration',
      label: 'Farm Registration Certificate',
      description: 'Official farm registration document',
      icon: '📜',
    },
    {
      id: 'landSurvey',
      label: 'Land Survey Report',
      description: 'Land survey document with details',
      icon: '📐',
    },
  ];

  const handleFileUpload = (docId, file) => {
    if (file) {
      setDocuments(prev => ({
        ...prev,
        [docId]: {
          file,
          status: 'pending',
          fileName: file.name,
        }
      }));
    }
  };

  const handleSubmit = async () => {
    const allUploaded = Object.values(documents).every(doc => doc.file);
    if (!allUploaded) {
      alert('Please upload all required documents');
      return;
    }

    try {
      setIsUploading(true);
      
      // Collect all files
      const allFiles = Object.values(documents)
        .map(doc => doc.file)
        .filter(Boolean);

      // Upload to backend
      const result = await uploadService.uploadKYCDocuments(allFiles, 'farmer_kyc');
      
      console.log('✅ KYC documents submitted:', result);
      
      setSubmittedAt(new Date().toLocaleDateString());
      setAllSubmitted(true);
      alert('✅ Documents submitted successfully! Our team will review within 24-48 hours.');
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('❌ Error submitting documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const _getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'pending': return 'text-blue-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-50';
      case 'pending': return 'bg-blue-50';
      case 'rejected': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Farmer Account Verification</h1>
          <p className="text-gray-600">Complete your profile verification to start selling on FarmDirect</p>
        </div>

        {/* Verification Status - After Submission */}
        {allSubmitted && (
          <>
            <Card className="mb-8 bg-blue-50 border-l-4 border-blue-600">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Verification In Progress</h3>
                    <p className="text-gray-700 text-sm mb-2">Your documents were submitted on {submittedAt}</p>
                    <p className="text-gray-600 text-sm">Our admin team is reviewing your documents. You'll receive an email notification once verification is complete (typically 24-48 hours).</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-lg text-center p-12 mb-8">
              <Clock className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You for Submitting!</h2>
              <p className="text-gray-700 mb-2" >
                Your farmer account verification documents have been successfully submitted.
              </p>
              <p className="text-gray-600 mb-8">
                Our admin team is now reviewing your information. You'll receive an email notification once your account is verified (typically within 24-48 hours).
              </p>
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <p className="text-sm text-green-800 mb-3">
                  <strong>What to expect:</strong>
                </p>
                <ul className="text-sm text-green-700 space-y-2 text-left">
                  <li>• Documents are verified for authenticity and accuracy</li>
                  <li>• Email notification upon approval with your seller dashboard access</li>
                  <li>• You can track your verification status by logging in anytime</li>
                  <li>• Start selling crops once your account is verified</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => window.location.reload()}
                >
                  Refresh Status
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/farmer/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Upload Form - Only show before submission */}
        {!allSubmitted && (
          <>
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Verification Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {requiredDocs.map((doc, idx) => {
                const docData = documents[doc.id];
                return (
                  <div key={doc.id} className="text-center">
                    <div className={`text-4xl mb-2 opacity-70`}>{doc.icon}</div>
                    <p className="text-xs text-gray-600 font-medium">{doc.label}</p>
                    <Badge
                      label={docData.status === 'pending' && !docData.file ? 'Pending' : docData.file ? 'Uploaded' : 'Pending'}
                      variant={docData.file ? 'success' : 'warning'}
                      size="sm"
                      className="mt-2 mx-auto"
                    />
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(Object.values(documents).filter(d => d.file).length / requiredDocs.length) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {Object.values(documents).filter(d => d.file).length} of {requiredDocs.length} documents uploaded
            </p>
          </div>
        </Card>

        {/* Document Upload Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Required Documents</h2>

          {requiredDocs.map((doc) => (
            <Card key={doc.id} className={`${getStatusBg(documents[doc.id].status)}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl">{doc.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{doc.label}</h3>
                      <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                    </div>
                  </div>
                  <Badge
                    label={documents[doc.id].file ? 'Uploaded' : 'Required'}
                    variant={documents[doc.id].file ? 'success' : 'warning'}
                  />
                </div>

                {documents[doc.id].file ? (
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{documents[doc.id].fileName}</p>
                          <p className="text-xs text-gray-500">Ready for verification</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileUpload(doc.id, null)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition cursor-pointer mb-4">
                    <label htmlFor={`upload-${doc.id}`} className="cursor-pointer w-full">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="font-medium text-gray-900">Click to upload</p>
                        <p className="text-sm text-gray-500">or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG up to 10MB</p>
                      </div>
                      <input
                        id={`upload-${doc.id}`}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(doc.id, e.target.files?.[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                )}

                <div className="bg-white bg-opacity-50 rounded p-3 text-sm text-gray-700">
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc list-inside mt-2 text-gray-600 text-xs space-y-1">
                    <li>Ensure document is clear and legible</li>
                    <li>All four corners of document should be visible</li>
                    <li>File should not be blurry or poorly lit</li>
                    <li>Maximum file size: 10MB</li>
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Terms & Conditions */}
        <Card className="mt-8 bg-yellow-50 border-l-4 border-yellow-600">
          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-3">Important Information</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>✓ All information must be accurate and complete</p>
              <p>✓ Documents must be original and not forged</p>
              <p>✓ False information may result in account suspension</p>
              <p>✓ Your documents are stored securely and used only for verification</p>
              <p>✓ Verification typically takes 24-48 hours</p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-yellow-200">
              <input type="checkbox" id="terms" className="cursor-pointer" />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                I certify that all information provided is true and accurate
              </label>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => navigate('/farmer/dashboard')}
            variant="secondary"
            size="lg"
            className="flex-1"
            disabled={isUploading}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={allSubmitted || isUploading}
          >
            {isUploading ? '⏳ Submitting...' : allSubmitted ? 'Documents Submitted' : 'Submit for Verification'}
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
