import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Card from './common/Card';
import { AlertTriangle, Clock, CheckCircle2, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function SmartLowStockMonitor({ onRestock }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSmartLowStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/farmer/inventory/smart-low-stock');
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not fetch smart stock analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartLowStock();
  }, []);

  return (
    <Card className="p-6 bg-white/95 border border-stone-200/90 shadow-md rounded-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {t('priceForecast.daysCover', 'Days of Stock Cover')}
          </span>
          <h3 className="font-serif-display text-xl font-bold text-[#132E20] mt-1">
            Smart Low-Stock Inventory Monitor
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Calculated dynamically from recent daily sales velocity rather than arbitrary fixed thresholds.
          </p>
        </div>
        <button
          onClick={fetchSmartLowStock}
          disabled={loading}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="py-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#D97736]" />
          <span>Analyzing sales velocity & stock coverage...</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-8 text-center text-stone-400 text-xs">
          <PackageCheck className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          <span>No active inventory items found to analyze.</span>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const isCritical = item.urgency === 'critical';
            const isWarning = item.urgency === 'warning';

            return (
              <div
                key={item.cropId}
                className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : isWarning
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-stone-50/60 border-stone-200 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isCritical
                        ? 'bg-rose-600 text-white'
                        : isWarning
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isCritical ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isWarning ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{item.cropName}</h4>
                    <p className="text-xs opacity-75">
                      Current: <span className="font-semibold">{item.currentStock} {item.unit}</span> | Velocity: <span className="font-semibold">{item.dailyVelocity} {item.unit}/day</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full inline-block ${
                        isCritical
                          ? 'bg-rose-200 text-rose-900'
                          : isWarning
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.daysOfCover !== null ? `${item.daysOfCover} days left` : 'Steady stock'}
                    </span>
                  </div>

                  {onRestock && (isCritical || isWarning) && (
                    <button
                      onClick={() => onRestock(item.cropId)}
                      className="px-3 py-1 bg-[#D97736] hover:bg-[#c2652b] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Restock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
