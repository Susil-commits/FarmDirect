import { useState } from 'react';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function CropPerformanceTable({ data }) {
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="p-16 text-center">
          <p className="text-gray-500">No crop data available</p>
        </div>
      </Card>
    );
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'revenue':
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
        break;
      case 'orders':
        aVal = a.ordersReceived;
        bVal = b.ordersReceived;
        break;
      case 'rating':
        aVal = a.rating;
        bVal = b.rating;
        break;
      case 'conversion':
        aVal = parseFloat(a.conversionRate);
        bVal = parseFloat(b.conversionRate);
        break;
      case 'performance':
        aVal = a.performanceScore;
        bVal = b.performanceScore;
        break;
      default:
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
    }

    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="text-gray-300">↕</span>;
    return sortOrder === 'desc' ? <TrendingDown size={16} /> : <TrendingUp size={16} />;
  };

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold">Crop Performance Analysis</h3>
          <p className="text-gray-600 text-sm mt-2">
            Click column headers to sort. {sortedData.length} crops total.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Crop</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center gap-2">
                    Revenue
                    <SortIcon column="revenue" />
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('orders')}
                >
                  <div className="flex items-center gap-2">
                    Orders
                    <SortIcon column="orders" />
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('rating')}
                >
                  <div className="flex items-center gap-2">
                    Rating
                    <SortIcon column="rating" />
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('conversion')}
                >
                  <div className="flex items-center gap-2">
                    Conv. Rate
                    <SortIcon column="conversion" />
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('performance')}
                >
                  <div className="flex items-center gap-2">
                    Performance
                    <SortIcon column="performance" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((crop, idx) => (
                <tr 
                  key={idx} 
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{crop.cropName}</p>
                    <p className="text-gray-500 text-xs">₹{crop.price}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{crop.category}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-green-600">
                      ₹{(crop.totalRevenue / 1000).toFixed(2)}K
                    </p>
                    <p className="text-gray-500 text-xs">{crop.unitsSold} units</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{crop.ordersReceived}</p>
                    <p className="text-gray-500 text-xs">avg ₹{crop.avgOrderValue}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">{crop.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-gray-500 text-xs">{crop.reviews} reviews</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{crop.conversionRate}%</p>
                    <p className="text-gray-500 text-xs">{crop.views} views</p>
                  </td>
                  <td className="px-4 py-3">
                    <PerformanceScore score={crop.performanceScore} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant={
                        crop.status === 'active' ? 'success' :
                        crop.status === 'inactive' ? 'warning' :
                        'danger'
                      }
                    >
                      {crop.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Performance Score Legend</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Excellent (80-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Good (60-80)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Fair (40-60)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Poor (0-40)</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PerformanceScore({ score }) {
  let color, bgColor;
  
  if (score >= 80) {
    color = 'text-green-600';
    bgColor = 'bg-green-100';
  } else if (score >= 60) {
    color = 'text-blue-600';
    bgColor = 'bg-blue-100';
  } else if (score >= 40) {
    color = 'text-yellow-600';
    bgColor = 'bg-yellow-100';
  } else {
    color = 'text-red-600';
    bgColor = 'bg-red-100';
  }

  return (
    <div className={`${bgColor} ${color} w-16 h-16 rounded-lg flex items-center justify-center`}>
      <div className="text-center">
        <p className="font-bold text-lg">{score}</p>
        <p className="text-xs">score</p>
      </div>
    </div>
  );
}
