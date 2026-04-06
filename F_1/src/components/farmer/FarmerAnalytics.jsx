import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Package, DollarSign, AlertTriangle, 
  Download, RefreshCw, Calendar, FileUp, AlertCircle, CheckCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import farmerService from '../../services/farmerService';
import RevenueChart from './RevenueChart';
import CropPerformanceTable from './CropPerformanceTable';
import InventoryManager from './InventoryManager';
import BulkUploadForm from './BulkUploadForm';

export default function FarmerAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [cropAnalytics, setCropAnalytics] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data on mount and when period changes
  useEffect(() => {
    loadAllData();
  }, [period]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel API calls
      const [stats, analytics, revenue, lowStock] = await Promise.all([
        farmerService.getDashboardStats(),
        farmerService.getCropAnalytics(period),
        farmerService.getRevenueAnalytics(period),
        farmerService.getLowStockItems()
      ]);

      setDashboardStats(stats.data);
      setCropAnalytics(analytics);
      setRevenueData(revenue);
      setLowStockItems(lowStock.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      await farmerService.getExportTemplate();
    } catch (err) {
      setError('Failed to download template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Farmer Analytics Dashboard</h1>
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Alert for low stock items */}
          {lowStockItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Low Stock Alert</p>
                <p className="text-yellow-700 text-sm">{lowStockItems.length} items have inventory below threshold</p>
              </div>
            </div>
          )}

          {/* Period selector */}
          <div className="flex gap-2">
            {['week', 'month', 'year'].map(p => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                variant={period === p ? 'primary' : 'secondary'}
                size="sm"
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Revenue"
              value={`₹${(dashboardStats.totalRevenue / 100000).toFixed(2)}L`}
              icon={<DollarSign className="w-6 h-6" />}
              color="text-green-600"
              bg="bg-green-50"
              subtext={`${dashboardStats.completedOrders} completed orders`}
            />
            <StatCard
              label="Active Listings"
              value={dashboardStats.totalActiveListing}
              icon={<Package className="w-6 h-6" />}
              color="text-blue-600"
              bg="bg-blue-50"
              subtext={`${dashboardStats.lowStockItems} low stock`}
            />
            <StatCard
              label="Total Sold"
              value={`${dashboardStats.totalUnitssSold} units`}
              icon={<TrendingUp className="w-6 h-6" />}
              color="text-purple-600"
              bg="bg-purple-50"
              subtext={`${dashboardStats.pendingOrders} orders pending`}
            />
            <StatCard
              label="Avg Rating"
              value={`${dashboardStats.averageRating} ⭐`}
              icon={<BarChart3 className="w-6 h-6" />}
              color="text-orange-600"
              bg="bg-orange-50"
              subtext={`Based on ${cropAnalytics?.summary?.totalOrders || 0} orders`}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'revenue', label: 'Revenue Trends', icon: TrendingUp },
              { id: 'crops', label: 'Crop Performance', icon: Package },
              { id: 'inventory', label: 'Inventory', icon: AlertTriangle },
              { id: 'upload', label: 'Bulk Upload', icon: FileUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && cropAnalytics && (
            <div className="grid gap-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Sales Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border-l-4 border-green-600 pl-4">
                      <p className="text-gray-600 text-sm">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">
                        ₹{(cropAnalytics.summary.totalRevenue / 100000).toFixed(2)}L
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-600 pl-4">
                      <p className="text-gray-600 text-sm">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {cropAnalytics.summary.totalOrders}
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4">
                      <p className="text-gray-600 text-sm">Avg Conversion Rate</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {cropAnalytics.summary.avgConversionRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Top Performing Crops */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Top Performing Crops</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Crop</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Revenue</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Orders</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Rating</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Conversion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cropAnalytics.data.slice(0, 5).map((crop, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{crop.cropName}</td>
                            <td className="px-4 py-3">₹{(crop.totalRevenue / 1000).toFixed(2)}K</td>
                            <td className="px-4 py-3">{crop.ordersReceived}</td>
                            <td className="px-4 py-3">
                              <Badge variant={crop.rating >= 4 ? 'success' : crop.rating >= 3 ? 'warning' : 'danger'}>
                                {crop.rating.toFixed(1)} ⭐
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{crop.conversionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && revenueData && (
            <RevenueChart data={revenueData} />
          )}

          {/* Crops Tab */}
          {activeTab === 'crops' && cropAnalytics && (
            <CropPerformanceTable data={cropAnalytics.data} />
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <InventoryManager items={lowStockItems} onRefresh={handleRefresh} />
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <BulkUploadForm 
              onUploadSuccess={handleRefresh}
              onDownloadTemplate={handleDownloadTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color, bg, subtext }) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtext && <p className="text-gray-500 text-xs mt-2">{subtext}</p>}
          </div>
          <div className={`${bg} p-3 rounded-lg`}>
            <div className={color}>{icon}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
