import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import Card from './common/Card';
import { TrendingUp, TrendingDown, Minus, AlertCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function PriceForecastCard({ defaultCropName = 'Tomato', userRegion = 'Odisha', crops = [] }) {
  const { t, i18n } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState(defaultCropName);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (crops.length > 0 && !selectedCrop) {
      setSelectedCrop(crops[0].cropName);
    }
  }, [crops, selectedCrop]);

  const fetchForecast = async (cropName) => {
    if (!cropName) return;
    setLoading(true);
    setError(null);
    try {
      const currentLang = ['hi', 'od'].includes(i18n.language) ? i18n.language : 'en';
      const res = await api.get('/ai/price-forecast', {
        params: {
          cropName,
          region: userRegion,
          daysAhead: 14,
          language: currentLang,
        },
      });

      if (res.data?.success) {
        setForecastData(res.data);
      } else {
        setError(res.data?.message || 'Failed to load forecast');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Price forecasting service currently unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCrop) {
      fetchForecast(selectedCrop);
    }
  }, [selectedCrop, i18n.language]);

  // Format chart data
  const chartData = (forecastData?.forecast || []).map((pt) => ({
    date: pt.date.slice(5), // 'MM-DD'
    fullDate: pt.date,
    p10: pt.p10,
    p50: pt.p50,
    p90: pt.p90,
    spread: [pt.p10, pt.p90],
  }));

  const isModelBeatingBaseline = forecastData?.beatsBaseline;

  return (
    <Card className="p-6 bg-white/95 border border-stone-200/90 shadow-lg rounded-3xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {t('priceForecast.advisoryTag', 'AI Advisory (Hold/Sell)')}
            </span>
            {forecastData?.confidence && (
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                {Math.round(forecastData.confidence * 100)}% {t('common.confidence', 'confidence')}
              </span>
            )}
          </div>
          <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-[#132E20] mt-1">
            {t('priceForecast.title', 'Market Price Forecast & Selling Advice')}
          </h3>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-2">
          {crops.length > 0 ? (
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D97736]"
            >
              {crops.map((c) => (
                <option key={c._id || c.cropName} value={c.cropName}>
                  {c.cropName}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              placeholder="e.g. Tomato"
              className="bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D97736] w-32"
            />
          )}

          <button
            onClick={() => fetchForecast(selectedCrop)}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-stone-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#D97736]" />
          <span>{t('priceForecast.loading', 'Calculating price forecast...')}</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Safeguard state: Model did NOT beat baseline */}
      {!loading && forecastData && !isModelBeatingBaseline && (
        <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl text-center my-4">
          <ShieldAlert className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-700">
            {t('priceForecast.forecastHidden', 'Forecast hidden: Model did not beat baseline safeguards for this crop/region.')}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Baseline MAPE: {forecastData.baselineMape}% | Model MAPE: {forecastData.modelMape}%. We only serve forecasts that outperform standard seasonal trends.
          </p>
        </div>
      )}

      {/* Forecast Content when Model BEATS Baseline */}
      {!loading && forecastData && isModelBeatingBaseline && (
        <>
          {/* Recommendation Banner */}
          {forecastData.recommendation && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                  {forecastData.recommendation.includes('+') ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : forecastData.recommendation.includes('-') ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <Minus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Decision Guidance
                  </span>
                  <p className="text-sm font-medium text-emerald-950 mt-0.5">
                    {forecastData.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="corridorColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} domain={['auto', 'auto']} unit="₹" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-stone-200 rounded-xl shadow-md text-xs">
                          <p className="font-bold text-stone-700 mb-1">{data.fullDate}</p>
                          <p className="text-emerald-700 font-bold">Median (p50): ₹{data.p50}/kg</p>
                          <p className="text-stone-500">Optimistic (p90): ₹{data.p90}/kg</p>
                          <p className="text-stone-500">Conservative (p10): ₹{data.p10}/kg</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Confidence Corridor (p10 to p90) */}
                <Area type="monotone" dataKey="p90" stroke="transparent" fill="url(#corridorColor)" />
                <Area type="monotone" dataKey="p10" stroke="transparent" fill="#FFFFFF" />
                {/* Median Projection Line (p50) */}
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#059669' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Model Metrics & Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-3 pt-3 border-t border-stone-100 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>Median Projected Price (p50)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" />
                <span>80% Confidence Band (p10–p90)</span>
              </span>
            </div>
            <div>
              <span>Model: {forecastData.modelUsed} (sMAPE {forecastData.modelMape}%)</span>
            </div>
          </div>
        </>
      )}

      {/* Advisory disclaimer */}
      <p className="text-[10px] text-stone-400 text-center mt-3">
        {t('priceForecast.disclaimer', 'AI projections are advisory only. Actual rates depend on daily mandi arrivals and weather.')}
      </p>
    </Card>
  );
}
