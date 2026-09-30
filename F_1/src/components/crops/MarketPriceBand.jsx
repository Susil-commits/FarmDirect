import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Info, Sparkles } from 'lucide-react';
import { getPriceGuidance } from '../../services/aiChatService.js';
import { useTranslation } from 'react-i18next';

export default function MarketPriceBand({
  cropName,
  region = '',
  days = 30,
  isOrganic = false,
  currentPrice = null,
  unit = 'kg',
  compact = false,
}) {
  const { t } = useTranslation();
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!cropName || cropName.trim().length < 2) {
      setGuidance(null);
      return;
    }

    const fetchGuidance = async () => {
      try {
        setLoading(true);
        const data = await getPriceGuidance(cropName.trim(), region, days, isOrganic);
        if (isMounted) {
          setGuidance(data);
        }
      } catch {
        if (isMounted) setGuidance(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGuidance();
    return () => {
      isMounted = false;
    };
  }, [cropName, region, days, isOrganic]);

  if (!cropName || cropName.trim().length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl animate-pulse flex items-center gap-2 text-xs text-emerald-700">
        <Sparkles size={14} className="animate-spin text-emerald-600" />
        <span>{t('marketBand.loading', 'Fetching live market price guidance...')}</span>
      </div>
    );
  }

  if (!guidance || !guidance.sufficientData || guidance.status === 'insufficient_data') {
    if (compact) return null;
    return (
      <div className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-xl flex items-center gap-2 text-xs text-stone-500">
        <Info size={14} className="text-stone-400 shrink-0" />
        <span>
          {t(
            'marketBand.insufficientData',
            'Market benchmark: Collecting recent price history for this crop.'
          )}
        </span>
      </div>
    );
  }

  const { p25, median, p75, minPrice, maxPrice, count, trendPercent } = guidance;
  const numCurrentPrice = currentPrice !== null && currentPrice !== '' ? Number(currentPrice) : null;

  let pricePosition = null;
  if (numCurrentPrice !== null && !isNaN(numCurrentPrice)) {
    if (numCurrentPrice < p25) {
      pricePosition = {
        label: t('marketBand.belowBand', 'Below Market Band (Competitive)'),
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    } else if (numCurrentPrice > p75) {
      pricePosition = {
        label: t('marketBand.aboveBand', 'Premium / Above Market Band'),
        color: 'text-amber-800 bg-amber-50 border-amber-200',
      };
    } else {
      pricePosition = {
        label: t('marketBand.inBand', 'Fair Market Range'),
        color: 'text-blue-700 bg-blue-50 border-blue-200',
      };
    }
  }

  return (
    <div
      className={`bg-gradient-to-br from-emerald-50/60 via-stone-50/70 to-teal-50/60 border border-emerald-200/70 rounded-2xl p-3.5 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-stone-800">
          <TrendingUp size={15} className="text-emerald-600" />
          <span>{t('marketBand.title', 'Market Price Band (Last {{days}} Days)', { days })}</span>
        </div>
        <div className="flex items-center gap-2">
          {trendPercent !== undefined && trendPercent !== 0 && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                trendPercent > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {trendPercent > 0 ? '+' : ''}
              {trendPercent}%
            </span>
          )}
          <span className="text-[11px] text-stone-500">
            {t('marketBand.snapshots', '{{count}} transactions', { count })}
          </span>
        </div>
      </div>

      {/* Visual Price Corridor Bar */}
      <div className="space-y-1.5 my-2.5">
        <div className="relative h-3 bg-stone-200/80 rounded-full overflow-hidden flex items-center">
          {/* Min to P25 buffer */}
          <div className="h-full bg-stone-300/60 w-1/4" />
          {/* P25 to P75 Fair Market Band Corridor */}
          <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 w-1/2 shadow-inner" />
          {/* P75 to Max buffer */}
          <div className="h-full bg-stone-300/60 w-1/4" />
        </div>

        {/* Labels underneath the bar */}
        <div className="flex justify-between items-center text-[11px] font-medium text-stone-600">
          <div>
            <span className="text-stone-400 block text-[10px] uppercase">Min</span>
            <span>₹{minPrice}</span>
          </div>
          <div className="text-center text-emerald-800 font-bold">
            <span className="text-emerald-700 block text-[10px] uppercase">
              25% (₹{p25})
            </span>
          </div>
          <div className="text-center px-2 py-0.5 bg-white shadow-sm border border-emerald-300 rounded-md text-emerald-800 font-extrabold">
            <span className="text-stone-500 block text-[9px] uppercase">
              Fair Median
            </span>
            <span>₹{median}/{unit}</span>
          </div>
          <div className="text-center text-teal-800 font-bold">
            <span className="text-teal-700 block text-[10px] uppercase">
              75% (₹{p75})
            </span>
          </div>
          <div className="text-right">
            <span className="text-stone-400 block text-[10px] uppercase">Max</span>
            <span>₹{maxPrice}</span>
          </div>
        </div>
      </div>

      {/* Real-time comparison badge for input price */}
      {pricePosition && (
        <div
          className={`mt-2.5 px-3 py-1.5 border rounded-xl flex items-center justify-between text-xs font-semibold ${pricePosition.color}`}
        >
          <span>{pricePosition.label}</span>
          <span>
            ₹{numCurrentPrice}/{unit}
          </span>
        </div>
      )}
    </div>
  );
}
