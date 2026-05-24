import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/common/ProtectedRoute.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import PageTransition from '../../components/common/PageTransition.jsx';
import ScrollAnimation from '../../components/common/ScrollAnimation.jsx';
import { Search, Filter, FileText, Image as ImageIcon, Eye, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';
import api from '../../services/api.js';
import { useRouter } from '../../context/RouterContext.jsx';
import { getImageUrl } from '../../utils/formatters';

/**
 * AdminDocuments - Document and Image Viewer for Admin
 * View all KYC documents, farm images, and crop images uploaded by farmers and buyers
 * 
 * Role-based filtering: Admins can filter documents by role (farmer/buyer) and KYC status
 * Real data only: All documents must have valid URLs (no placeholder images)
 */
export default function AdminDocuments() {
  const { currentRoute, navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    role: '',
    kycStatus: '',
    searchQuery: ''
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Fetch users with documents
  const fetchUsers = async (pageNum = 1) => {
    try {
      setSearchLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum,
        limit: 20
      });

      if (filters.role) params.append('role', filters.role);
      if (filters.kycStatus) params.append('kycStatus', filters.kycStatus);

      const response = await api.get(`/admin/documents/search?${params}`);
      // api interceptor already unwraps response.data, so response is { success, users, pagination }
      setUsers(response.users || []);
      setPagination(response.pagination || {});
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch user details with documents
  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/documents/${userId}`);
      // api interceptor already unwraps response.data, so response is { success, data: { user, documents } }
      setSelectedUser(response.data || null);
    } catch (err) {
      console.error('Failed to fetch user documents:', err);
      setError(err.message || 'Failed to load user documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    setPage(1);
  }, [filters]);

  // Check if userId is in route params and load user documents
  useEffect(() => {
    // Parse userId from the RouterContext currentRoute (e.g., /admin/documents?userId=abc123)
    const queryString = currentRoute.includes('?') ? currentRoute.split('?')[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const userId = urlParams.get('userId');
    if (userId) {
      fetchUserDetails(userId);
    }
  }, [currentRoute]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers(newPage);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const KYCStatusBadge = ({ status }) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
          <CheckCircle size={16} /> Verified
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
          <AlertCircle size={16} /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
        <AlertCircle size={16} /> Pending
      </span>
    );
  };

  const DocumentCard = ({ doc }) => {
    const isImage = doc.mimeType?.startsWith('image/');

    return (
      <div
        className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={() => setSelectedDocument(doc)}
      >
        {isImage ? (
          <div className="h-40 bg-gray-100 overflow-hidden relative">
            <img
              src={doc.url}
              alt={doc.fileName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="h-40 bg-gray-100 flex items-center justify-center">
            <FileText size={48} className="text-gray-400" />
          </div>
        )}
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
          <p className="text-xs text-gray-500 mt-1">{formatFileSize(doc.fileSize)}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDocument(doc);
              }}
              className="w-full px-2 py-1.5 bg-blue-100 text-blue-600 rounded text-xs font-semibold hover:bg-blue-200 flex items-center justify-center gap-1 transition"
            >
              <Eye size={14} /> Preview
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute roles="admin">
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <ScrollAnimation className="scroll-slide mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/admin/approvals')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-gray-700 hover:text-green-700"
                    title="Back to KYC Approvals"
                  >
                    <ArrowLeft size={24} />
                    <span className="font-semibold text-sm hidden sm:inline">Back to KYC Approvals</span>
                  </button>
                  <h1 className="text-4xl font-bold text-gray-900">Document & Image Viewer</h1>
                </div>
              </div>
              <p className="text-gray-600">
                View all KYC documents, farm images, and crop images uploaded by farmers and buyers
              </p>
            </ScrollAnimation>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Filters */}
              <ScrollAnimation className="scroll-slide">
                <Card className="p-6 h-fit">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Filter size={20} /> Filters
                  </h3>

                  <div className="space-y-4">
                    {/* Role Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Role
                      </label>
                      <select
                        name="role"
                        value={filters.role}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
                      >
                        <option value="">All Roles</option>
                        <option value="farmer">Farmers</option>
                        <option value="buyer">Buyers</option>
                      </select>
                    </div>

                    {/* KYC Status Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        KYC Status
                      </label>
                      <select
                        name="kycStatus"
                        value={filters.kycStatus}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Results Info */}
                    <div className="pt-4 border-t-2 border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">{pagination.total || 0}</span> total users
                      </p>
                      {pagination.pages > 1 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Page <span className="font-bold text-gray-900">{page}</span> of{' '}
                          <span className="font-bold text-gray-900">{pagination.pages}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {error && (
                  <ScrollAnimation className="scroll-slide mb-6">
                    <Card className="bg-red-50 border-l-4 border-red-500 p-4">
                      <p className="text-red-800 font-semibold">{error}</p>
                    </Card>
                  </ScrollAnimation>
                )}

                {/* Users List */}
                {searchLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading documents...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <Card className="text-center p-12">
                    <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">No users found</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                  </Card>
                ) : (
                  <ScrollAnimation className="scroll-slide space-y-4">
                    {users.map(userItem => (
                      <Card
                        key={userItem.id}
                        className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedUser(null);
                          fetchUserDetails(userItem.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{userItem.name}</h4>
                              <KYCStatusBadge status={userItem.kycStatus} />
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                {userItem.role}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{userItem.email}</p>
                            <div className="flex flex-wrap gap-3 text-xs">
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded">
                                <FileText size={14} className="text-gray-600" />
                                <span className="font-semibold">{userItem.documentCounts?.kycDocuments || 0} KYC Docs</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded">
                                <ImageIcon size={14} className="text-gray-600" />
                                <span className="font-semibold">{userItem.documentCounts?.farmImages || 0} Farm Images</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded">
                                <ImageIcon size={14} className="text-gray-600" />
                                <span className="font-semibold">{userItem.documentCounts?.cropImages || 0} Crop Images</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchUserDetails(userItem.id);
                            }}
                            disabled={loading}
                          >
                            {selectedUser?.user?.id === userItem.id && loading ? 'Loading...' : 'View'}
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="flex justify-center gap-2 mt-8 pt-6 border-t-2 border-gray-200">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-semibold"
                        >
                          Previous
                        </button>
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`px-4 py-2 rounded-lg font-semibold ${
                              p === page
                                ? 'bg-green-600 text-white'
                                : 'border-2 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === pagination.pages}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-semibold"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </ScrollAnimation>
                )}
              </div>
            </div>

            {/* Document Details */}
            {selectedUser && (
              <ScrollAnimation className="scroll-slide mt-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedUser.user?.name}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">{selectedUser.user?.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                    >
                      Close
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* KYC Documents */}
                      {selectedUser.documents?.kycDocuments && selectedUser.documents.kycDocuments.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <FileText size={24} /> KYC Documents ({selectedUser.documents.kycDocuments.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {selectedUser.documents.kycDocuments.map((doc, idx) => (
                              <DocumentCard key={idx} doc={doc} type="KYC" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Farm Images */}
                      {selectedUser.documents?.farmImages && selectedUser.documents.farmImages.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <ImageIcon size={24} /> Farm Images ({selectedUser.documents.farmImages.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {selectedUser.documents.farmImages.map((imageUrl, idx) => (
                              <div
                                key={idx}
                                className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() =>
                                  setSelectedDocument({
                                    fileName: `farm-image-${idx}.jpg`,
                                    url: imageUrl,
                                    mimeType: 'image/jpeg',
                                    fileSize: 0,
                                    uploadedAt: new Date(),
                                    type: 'Farm Image'
                                  })
                                }
                              >
                                <div className="h-40 bg-gray-100 overflow-hidden">
                                  <img
                                    src={getImageUrl(imageUrl)}
                                    alt={`Farm ${idx}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                </div>
                                <div className="p-3">
                                  <p className="text-xs text-gray-500">Farm Image</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Crop Images */}
                      {selectedUser.documents?.cropImages && selectedUser.documents.cropImages.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <ImageIcon size={24} /> Crop Listings ({selectedUser.documents.cropImages.length})
                          </h3>
                          <div className="space-y-4">
                            {selectedUser.documents.cropImages.map((crop, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-3">{crop.cropName}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                  {crop.images && crop.images.map((imageUrl, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                                      onClick={() =>
                                        setSelectedDocument({
                                          fileName: `${crop.cropName}-${imgIdx}.jpg`,
                                          url: imageUrl,
                                          mimeType: 'image/jpeg',
                                          fileSize: 0,
                                          uploadedAt: new Date(),
                                          type: 'Crop Image'
                                        })
                                      }
                                    >
                                      <div className="h-32 bg-gray-100 overflow-hidden">
                                        <img
                                          src={getImageUrl(imageUrl)}
                                          alt={`${crop.cropName} ${imgIdx}`}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!selectedUser.documents?.kycDocuments?.length &&
                        !selectedUser.documents?.farmImages?.length &&
                        !selectedUser.documents?.cropImages?.length && (
                          <div className="text-center py-12">
                            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No documents found</p>
                          </div>
                        )}
                    </div>
                  )}
                </Card>
              </ScrollAnimation>
            )}
          </div>

          {/* Document Preview Modal - Clean inline preview, no download */}
          {selectedDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDocument(null)}>
              <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedDocument.fileName}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedDocument.type || 'Document'} • {formatFileSize(selectedDocument.fileSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  {selectedDocument.mimeType?.startsWith('image/') ? (
                    <img
                      src={selectedDocument.url}
                      alt={selectedDocument.fileName}
                      className="w-full h-auto rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <FileText size={64} className="mb-4" />
                      <p className="font-semibold text-gray-600">Document Preview</p>
                      <p className="text-sm mt-1">This file type cannot be previewed inline.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
