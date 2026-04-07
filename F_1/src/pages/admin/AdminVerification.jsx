import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download, Eye, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function AdminVerification() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch verification requests on component mount
  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await adminService.getPendingKYC();
      // setVerificationRequests(response.data || []);
      setVerificationRequests([]);
    } catch (error) {
      console.error('Failed to fetch verification requests:', error);
      setVerificationRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Redirect non-admins
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">Access Denied: Only admins can access this page</p>
            <Button onClick={() => navigate('/')} variant="primary">
              Go To Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleApprove = () => {
    if (!selectedRequest) return;
    setVerificationRequests(prev =>
      prev.map(req =>
        req.id === selectedRequest.id
          ? { ...req, status: 'verified', verifiedDate: new Date().toLocaleDateString() }
          : req
      )
    );
    setSelectedRequest(null);
    alert('Verification approved successfully!');
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setVerificationRequests(prev =>
      prev.map(req =>
        req.id === selectedRequest.id
          ? { ...req, status: 'rejected', rejectionReason: rejectionReason }
          : req
      )
    );
    setSelectedRequest(null);
    setRejectionReason('');
    setShowRejectionModal(false);
    alert('Verification rejected successfully!');
  };

  const filteredRequests = verificationRequests.filter(req => req.status === activeTab);

  const stats = [
    { label: 'Total Requests', value: verificationRequests.length, color: 'text-blue-600' },
    { label: 'Pending', value: verificationRequests.filter(r => r.status === 'pending').length, color: 'text-orange-600' },
    { label: 'Verified', value: verificationRequests.filter(r => r.status === 'verified').length, color: 'text-green-600' },
    { label: 'Rejected', value: verificationRequests.filter(r => r.status === 'rejected').length, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verification Dashboard</h1>
          <p className="text-gray-600">Review and verify farmer and buyer documents</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <Card key={i}>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {['pending', 'verified', 'rejected'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedRequest(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${
                    activeTab === tab
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab === 'pending' && `Pending (${verificationRequests.filter(r => r.status === 'pending').length})`}
                  {tab === 'verified' && `Verified (${verificationRequests.filter(r => r.status === 'verified').length})`}
                  {tab === 'rejected' && `Rejected (${verificationRequests.filter(r => r.status === 'rejected').length})`}
                </button>
              ))}
            </div>

            {/* Request List */}
            <div className="space-y-3">
              {filteredRequests.map(req => (
                <Card
                  key={req.id}
                  hover
                  className={`cursor-pointer transition ${
                    selectedRequest?.id === req.id ? 'ring-2 ring-green-600' : ''
                  }`}
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{req.name}</h3>
                        <p className="text-xs text-gray-500">{req.email}</p>
                      </div>
                      {req.status === 'pending' && <Clock className="w-5 h-5 text-orange-600" />}
                      {req.status === 'verified' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {req.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        label={req.type}
                        variant={req.type === 'farmer' ? 'primary' : 'secondary'}
                        size="sm"
                      />
                      <span className="text-xs text-gray-500">{req.submittedDate}</span>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredRequests.length === 0 && (
                <Card>
                  <div className="p-8 text-center text-gray-500">
                    <p>No {activeTab} requests</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedRequest.name}</h2>
                      <p className="text-gray-600">{selectedRequest.email}</p>
                      <div className="flex gap-3 mt-3">
                        <Badge
                          label={selectedRequest.type.toUpperCase()}
                          variant={selectedRequest.type === 'farmer' ? 'primary' : 'secondary'}
                        />
                        <Badge
                          label={selectedRequest.status.toUpperCase()}
                          variant={
                            selectedRequest.status === 'verified'
                              ? 'success'
                              : selectedRequest.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Submitted Date</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.submittedDate}</p>
                    </div>
                    {selectedRequest.verifiedDate && (
                      <div>
                        <p className="text-sm text-gray-600">Verified Date</p>
                        <p className="font-semibold text-gray-900">{selectedRequest.verifiedDate}</p>
                      </div>
                    )}
                    {selectedRequest.rejectionReason && (
                      <div className="col-span-2 bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Rejection Reason</p>
                        <p className="font-semibold text-red-600">{selectedRequest.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Submitted Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedRequest.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border flex items-start gap-3 ${
                            doc.status === 'verified'
                              ? 'border-green-200 bg-green-50'
                              : doc.status === 'rejected'
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <span className="text-2xl">{doc.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                label={doc.status}
                                variant={
                                  doc.status === 'verified'
                                    ? 'success'
                                    : doc.status === 'rejected'
                                    ? 'danger'
                                    : 'warning'
                                }
                                size="sm"
                              />
                              <button className="text-blue-600 hover:text-blue-700 text-xs">
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <Button
                        onClick={handleApprove}
                        variant="primary"
                        className="flex items-center gap-2 flex-1"
                      >
                        <CheckCircle size={18} /> Approve Verification
                      </Button>
                      <Button
                        onClick={() => setShowRejectionModal(true)}
                        variant="danger"
                        className="flex items-center gap-2 flex-1"
                      >
                        <XCircle size={18} /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-12 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Select a request to review details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Rejection Modal */}
        {showRejectionModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Verification</h2>
                <p className="text-gray-600 mb-4">
                  Provide a reason for rejecting {selectedRequest.name}'s verification request
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setRejectionReason('');
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleReject} variant="danger" className="flex-1">
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
