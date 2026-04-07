import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Timeline from '../../components/common/Timeline';

export default function BuyerDashboard() {
  const { user, verificationStatus } = useAuth();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('active-orders');

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect non-buyers
  if (!user || user.role !== 'buyer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">Access Denied: Only buyers can view this dashboard</p>
            <Button onClick={() => navigate('/')} variant="primary">
              Go To Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Redirect unverified buyers to verification page
  if (verificationStatus !== 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Verification</h2>
            <p className="text-gray-600 mb-6">
              {verificationStatus === 'rejected' 
                ? 'Your documents were rejected. Please resubmit for verification.'
                : 'Please complete the verification process to access your dashboard.'}
            </p>
            <Button onClick={() => navigate('/verification/progress')} variant="primary" className="w-full">
              Complete Verification
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: 'Total Orders', value: '0', icon: <ShoppingCart className="w-6 h-6" />, color: 'text-blue-600' },
    { label: 'Saved Items', value: '0', icon: <Heart className="w-6 h-6" />, color: 'text-red-600' },
    { label: 'Active Orders', value: '0', icon: <Truck className="w-6 h-6" />, color: 'text-orange-600' },
    { label: 'Completed', value: '0', icon: <CheckCircle className="w-6 h-6" />, color: 'text-green-600' },
  ];

  const activeOrders = [];

  const orderHistory = [];

  const wishlist = [
    { name: 'Fresh Mushrooms', price: '₹80/kg', farmer: 'Amit Singh', location: 'Haryana' },
    { name: 'Organic Spinach', price: '₹45/kg', farmer: 'Neha Roy', location: 'Karnataka' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Welcome back, Priya Singh</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          {['active-orders', 'history', 'wishlist'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'active-orders' && 'Active Orders'}
              {tab === 'history' && 'Order History'}
              {tab === 'wishlist' && 'Wishlist'}
            </button>
          ))}
        </div>

        {/* Active Orders Tab */}
        {activeTab === 'active-orders' && (
          <div className="space-y-6">
            {activeOrders.map(order => (
              <Card key={order.id} hover>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{order.crop}</h3>
                      <p className="text-gray-600 text-sm">Order {order.id}</p>
                    </div>
                    <Badge label={order.status} variant="primary" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-gray-600 text-xs mb-1">FARMER</p>
                      <p className="font-semibold text-gray-900">{order.farmer}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs mb-1">QUANTITY</p>
                      <p className="font-semibold text-gray-900">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs mb-1">AMOUNT</p>
                      <p className="font-semibold text-gray-900">{order.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs mb-1">ORDER DATE</p>
                      <p className="font-semibold text-gray-900">{order.orderDate}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <p className="font-semibold text-gray-900 mb-4">Delivery Timeline</p>
                    <Timeline steps={order.timeline} />
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" size="sm">Contact Farmer</Button>
                    <Button variant="secondary" size="sm">Track Package</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'history' && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Crop</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderHistory.map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                        <td className="px-4 py-3 text-gray-600">{order.crop}</td>
                        <td className="px-4 py-3 text-gray-600">{order.quantity}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{order.total}</td>
                        <td className="px-4 py-3 text-gray-600">{order.date}</td>
                        <td className="px-4 py-3">
                          <Badge label={order.status} variant="success" size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wishlist.map((item, i) => (
              <Card key={i} hover>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-5xl">🥬</div>
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition">
                      <Heart size={20} fill="currentColor" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-green-600 font-semibold text-lg mb-2">{item.price}</p>
                  <p className="text-gray-600 text-sm mb-4">{item.farmer} • {item.location}</p>
                  <Button variant="primary" size="sm" className="w-full">
                    View & Order
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
