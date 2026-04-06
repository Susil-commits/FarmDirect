import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../../components/common/Card';

export default function RevenueChart({ data }) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card>
        <div className="p-16 text-center">
          <p className="text-gray-500">No revenue data available for this period</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Revenue Trend Line Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value) => `₹${(value / 1000).toFixed(2)}K`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                name="Revenue"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Orders & Units Sold Bar Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Orders & Units Sold</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar 
                dataKey="orders" 
                fill="#3b82f6" 
                name="Orders"
              />
              <Bar 
                dataKey="units" 
                fill="#8b5cf6" 
                name="Units Sold"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary Stats */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Revenue Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryStat
              label="Total Revenue"
              value={`₹${(data.totals.totalRevenue / 100000).toFixed(2)}L`}
              color="text-green-600"
            />
            <SummaryStat
              label="Total Orders"
              value={data.totals.totalOrders}
              color="text-blue-600"
            />
            <SummaryStat
              label="Total Units"
              value={data.totals.totalUnits}
              color="text-purple-600"
            />
            <SummaryStat
              label="Avg Daily Revenue"
              value={`₹${(parseFloat(data.totals.avgDailyRevenue) / 1000).toFixed(1)}K`}
              color="text-orange-600"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value, color }) {
  return (
    <div className="border-l-4 border-gray-300 pl-4">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
