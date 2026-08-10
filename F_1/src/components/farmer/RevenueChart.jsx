import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data }) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-12 text-center shadow-xl">
        <p className="text-stone-500 font-medium text-xs">No harvest revenue data recorded for this selection</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 font-sans-body text-[#132E20]">
      {/* Revenue Trend Line Chart */}
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-6 shadow-xl">
        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">SALES ANALYTICS</span>
          <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">Revenue Trajectory Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" style={{ fontSize: '11px', fill: '#57534e' }} />
            <YAxis style={{ fontSize: '11px', fill: '#57534e' }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(2)}K`} labelFormatter={(label) => `Date: ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#D97736" name="Gross Revenue" strokeWidth={3} dot={{ fill: '#D97736', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders & Units Sold Bar Chart */}
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-6 shadow-xl">
        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">QUANTITY METRICS</span>
          <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">Orders & Units Dispatched</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" style={{ fontSize: '11px', fill: '#57534e' }} />
            <YAxis style={{ fontSize: '11px', fill: '#57534e' }} />
            <Tooltip contentStyle={{ backgroundColor: '#FBF8F3', borderRadius: '16px', border: '1px solid #e7e5e4' }} />
            <Legend />
            <Bar dataKey="orders" fill="#132E20" name="Orders Received" radius={[6, 6, 0, 0]} />
            <Bar dataKey="units" fill="#D97736" name="Units Sold (kg)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-6 shadow-xl">
        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">PERFORMANCE SUMMARY</span>
          <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">Revenue Highlights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryStat
            label="Total Revenue"
            value={`₹${(data.totals.totalRevenue / 100000).toFixed(2)}L`}
            color="text-[#132E20]"
          />
          <SummaryStat
            label="Total Orders"
            value={data.totals.totalOrders}
            color="text-[#D97736]"
          />
          <SummaryStat
            label="Total Units"
            value={data.totals.totalUnits}
            color="text-[#132E20]"
          />
          <SummaryStat
            label="Avg Order Value"
            value={`₹${(data.totals.averageOrderValue || 0).toLocaleString('en-IN')}`}
            color="text-[#D97736]"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, color }) {
  return (
    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`font-serif-display text-2xl font-normal mt-1 ${color}`}>{value}</p>
    </div>
  );
}
