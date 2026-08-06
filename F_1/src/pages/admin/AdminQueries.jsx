import React, { useState, useEffect } from 'react';
import { Eye, Trash2, MessageSquare, Filter, Search, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import contactService from '../../services/contactService';
import { useToast } from '../../hooks/useToast';

export default function AdminQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Filter & Search
  const [filters, setFilters] = useState({
    status: 'All',
    inquiryType: 'All',
    kycStatus: 'All',
    searchTerm: '',
    page: 1,
    limit: 10
  });

  // Response form
  const [responseForm, setResponseForm] = useState({
    adminResponse: '',
    status: 'Resolved'
  });
  const [respondLoading, setRespondLoading] = useState(false);
  const { addToast } = useToast();

  // Fetch queries and stats
  useEffect(() => {
       
       
      // eslint-disable-next-line react-hooks/immutability
    fetchQueries();
       
      // eslint-disable-next-line react-hooks/immutability
    fetchStats();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.inquiryType, filters.page, filters.limit]);

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        sortBy: 'createdAt',
        order: -1
      };
      
      if (filters.status !== 'All') params.status = filters.status;
      if (filters.inquiryType !== 'All') params.inquiryType = filters.inquiryType;
      if (filters.kycStatus !== 'All') params.kycStatus = filters.kycStatus;

      const response = await contactService.getAllQueries(params);
      if (response.success) {
        setQueries(response.data);
      } else {
        setError(response.message || 'Error fetching queries');
      }
    } catch (err) {
      setError(err.message || 'Error fetching queries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await contactService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleViewDetail = async (queryId) => {
    setLoading(true);
    try {
      const response = await contactService.getQuery(queryId);
      if (response.success) {
        setSelectedQuery(response.data);
        setShowDetail(true);
        setResponseForm({
          adminResponse: response.data.adminResponse?.responseMessage || '',
          status: response.data.status
        });
      }
    } catch (err) {
      setError(err.message || 'Error fetching query details');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!responseForm.adminResponse.trim()) {
      addToast('Please enter a response message', 'warning');
      return;
    }

    setRespondLoading(true);
    try {
      const response = await contactService.updateQuery(selectedQuery._id, {
        adminResponse: responseForm.adminResponse,
        status: responseForm.status
      });

      if (response.success) {
        setSelectedQuery(response.data);
        setShowDetail(false);
        fetchQueries();
        fetchStats();
        setError('');
        addToast('Response sent successfully', 'success');
      }
    } catch (err) {
      setError(err.message || 'Error sending response');
    } finally {
      setRespondLoading(false);
    }
  };

  const handleDelete = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;

    try {
      const response = await contactService.deleteQuery(queryId);
      if (response.success) {
        setQueries(queries.filter(q => q._id !== queryId));
        fetchStats();
        addToast('Query deleted', 'success');
      }
    } catch (err) {
      setError(err.message || 'Error deleting query');
    }
  };

  const handleSearch = async () => {
    if (!filters.searchTerm.trim()) {
      fetchQueries();
      return;
    }

    setLoading(true);
    try {
      const response = await contactService.searchQueries(
        filters.searchTerm,
        filters.inquiryType !== 'All' ? filters.inquiryType : ''
      );
      if (response.success) {
        setQueries(response.data);
      }
    } catch (err) {
      setError(err.message || 'Error searching queries');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Read': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'General': 'bg-blue-50',
      'Support': 'bg-orange-50',
      'Partnership': 'bg-green-50',
      'Farmer Partnership': 'bg-emerald-50',
      'Feedback': 'bg-pink-50'
    };
    return colors[type] || 'bg-gray-50';
  };

  const getKycStatusBadge = (query) => {
    const user = query?.userId;
    if (!user || typeof user !== 'object') {
      return { label: 'Guest', color: 'bg-gray-200 text-gray-700', icon: '👤' };
    }
    switch (user.kycStatus) {
      case 'verified':
        return { label: 'Verified', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: '❌' };
      default:
        return { label: 'Not Verified', color: 'bg-orange-100 text-orange-800', icon: '⚠️' };
    }
  };

  if (showDetail && selectedQuery) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pt-28 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Query Details</h1>
            <Button
              variant="secondary"
              onClick={() => setShowDetail(false)}
            >
              Back to List
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Query Details */}
          <Card className="p-8 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Full Name</p>
                <p className="text-lg text-gray-900">{selectedQuery.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Email</p>
                <p className="text-lg text-gray-900">{selectedQuery.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Phone</p>
                <p className="text-lg text-gray-900">{selectedQuery.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Inquiry Type</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(selectedQuery.inquiryType)}`}>
                  {selectedQuery.inquiryType}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedQuery.status)}`}>
                  {selectedQuery.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">KYC Status</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getKycStatusBadge(selectedQuery).color}`}>
                  {getKycStatusBadge(selectedQuery).icon} {getKycStatusBadge(selectedQuery).label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Submitted</p>
                <p className="text-lg text-gray-900">{new Date(selectedQuery.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Message */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 font-semibold mb-3">Message</p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                {selectedQuery.message}
              </div>
            </div>
          </Card>

          {/* Response Form */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare size={24} className="text-green-600" />
              Send Response
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={responseForm.status}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, status: e.target.value }))}
                  disabled={respondLoading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 disabled:bg-gray-100"
                >
                  <option value="Read">Mark as Read</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Response *</label>
                <textarea
                  value={responseForm.adminResponse}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, adminResponse: e.target.value }))}
                  disabled={respondLoading}
                  rows="6"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none disabled:bg-gray-100"
                  placeholder="Type your response here... This will be sent to the customer via email."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetail(false)}
                  disabled={respondLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRespond}
                  disabled={respondLoading}
                  className="flex items-center gap-2"
                >
                  {respondLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-28 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Queries</h1>
            <p className="text-gray-600 mt-1">Manage customer inquiries and messages</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              fetchQueries();
              fetchStats();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <p className="text-sm text-gray-600 font-semibold mb-2">Total Queries</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 font-semibold mb-2">New</p>
              <p className="text-3xl font-bold text-blue-600">{stats.newQueries}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 font-semibold mb-2">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 font-semibold mb-2">Pending Response</p>
              <p className="text-3xl font-bold text-orange-600">
                {(stats.total - stats.resolved) || 0}
              </p>
            </Card>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters & Search */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, email, message..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
                <Search size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Read">Read</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Inquiry Type</label>
              <select
                value={filters.inquiryType}
                onChange={(e) => setFilters(prev => ({ ...prev, inquiryType: e.target.value, page: 1 }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="All">All Types</option>
                <option value="General">General</option>
                <option value="Support">Support</option>
                <option value="Partnership">Partnership</option>
                <option value="Farmer Partnership">Farmer Partnership</option>
                <option value="Feedback">Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">KYC Status</label>
              <select
                value={filters.kycStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value, page: 1 }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              >
                <option value="All">All Users</option>
                <option value="verified">✅ KYC Verified</option>
                <option value="not_verified">❌ Not Verified</option>
                <option value="pending">⏳ Pending</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                className="w-full"
              >
                <Search size={18} />
                Search
              </Button>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({
                    status: 'All',
                    inquiryType: 'All',
                    kycStatus: 'All',
                    searchTerm: '',
                    page: 1,
                    limit: 10
                  });
                  fetchQueries();
                }}
                className="w-full"
              >
                <Filter size={18} />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Queries Table */}
        <Card>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading queries...</p>
            </div>
          ) : queries.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No queries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">From</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">KYC</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Message</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((query) => (
                    <tr key={query._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{query.name}</p>
                          <p className="text-sm text-gray-600">{query.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getKycStatusBadge(query).color}`}>
                          {getKycStatusBadge(query).icon} {getKycStatusBadge(query).label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(query.inquiryType)}`}>
                          {query.inquiryType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(query.status)}`}>
                          {query.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 truncate max-w-xs">{query.message}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetail(query._id)}
                            className="flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(query._id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
