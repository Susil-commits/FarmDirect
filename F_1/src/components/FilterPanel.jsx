import { useState, useEffect } from 'react';
import { Filter, RotateCcw, X, Check, Leaf, MapPin, DollarSign, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';
import Button from './common/Button';
import Card from './common/Card';
import '../styles/FilterPanel.css';

export default function FilterPanel({
  cropTypes = [],
  locations = [],
  currentFilters = {},
  onFilterChange = () => {},
  onReset = () => {},
  onCloseMobile = null,
}) {
  const [localFilters, setLocalFilters] = useState({
    cropType: currentFilters.cropType || '',
    priceRange: currentFilters.priceRange || [0, 1000],
    location: currentFilters.location || '',
    verifiedFarmersOnly: currentFilters.verifiedFarmersOnly || false,
    organicOnly: currentFilters.organicOnly || false,
  });

  useEffect(() => {
    
    setLocalFilters({
      cropType: currentFilters.cropType || '',
      priceRange: currentFilters.priceRange || [0, 1000],
      location: currentFilters.location || '',
      verifiedFarmersOnly: currentFilters.verifiedFarmersOnly || false,
      organicOnly: currentFilters.organicOnly || false,
    });
  }, [currentFilters]);

  const handleFilterChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const handlePriceChange = (maxPrice) => {
    const updated = {
      ...localFilters,
      priceRange: [localFilters.priceRange[0], maxPrice],
    };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    const resetFilters = {
      cropType: '',
      priceRange: [0, 1000],
      location: '',
      verifiedFarmersOnly: false,
      organicOnly: false,
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  const categoryEmojis = {
    vegetables: '🥬',
    fruits: '🍎',
    grains: '🌾',
    herbs: '🌿',
    other: '🌽'
  };

  const activeCount = [
    localFilters.cropType,
    localFilters.location,
    localFilters.verifiedFarmersOnly,
    localFilters.organicOnly,
    localFilters.priceRange[1] < 1000
  ].filter(Boolean).length;

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-2xl rounded-[32px] p-6 space-y-6 transition-all duration-300">
      {}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#132E20] to-[#1B3B2B] text-white flex items-center justify-center shadow-lg shadow-[#132E20]/20 transform hover:scale-105 transition-transform">
            <SlidersHorizontal size={18} className="text-[#D97736]" />
          </div>
          <div>
            <h3 className="font-serif-display font-bold text-xl text-[#132E20] flex items-center gap-1.5">
              Filters
              {activeCount > 0 && (
                <span className="bg-[#D97736] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  {activeCount}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-stone-500">Refine harvest results</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 bg-stone-100 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Reset filters"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
          <span className="text-base">🥬</span> Crop Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFilterChange('cropType', '')}
            className={`p-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
              localFilters.cropType === ''
                ? 'bg-[#132E20] text-white border-[#132E20] shadow-md scale-[1.02]'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-white'
            }`}
          >
            <span>🌾</span> All Items
          </button>
          {cropTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFilterChange('cropType', type)}
              className={`p-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 border capitalize cursor-pointer ${
                localFilters.cropType === type
                  ? 'bg-[#132E20] text-white border-[#132E20] shadow-md scale-[1.02]'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-white'
              }`}
            >
              <span>{categoryEmojis[type] || '🌱'}</span> {type}
            </button>
          ))}
        </div>
      </div>

      {}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
            <span className="text-base">💰</span> Max Price (₹/kg)
          </label>
          <span className="text-xs font-extrabold text-[#D97736] bg-[#D97736]/10 px-2.5 py-0.5 rounded-full border border-[#D97736]/20">
            ₹{localFilters.priceRange[1]}
          </span>
        </div>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={localFilters.priceRange[1]}
            onChange={(e) => handlePriceChange(parseInt(e.target.value))}
            className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#D97736]"
          />
          <div className="bg-gradient-to-r from-[#FBF8F3] to-[#F4EFE6] border border-stone-200/80 p-3 rounded-2xl flex items-center justify-between shadow-xs">
            <span className="text-stone-500 text-xs font-semibold">Budget Range:</span>
            <span className="font-serif-display font-extrabold text-[#132E20] text-base">
              ₹0 — ₹{localFilters.priceRange[1]}
            </span>
          </div>
        </div>
      </div>

      {}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
          <span className="text-base">📍</span> Region / State
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => handleFilterChange('location', '')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              localFilters.location === ''
                ? 'bg-[#132E20] text-white border-[#132E20] shadow-xs'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-300'
            }`}
          >
            All Regions
          </button>
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleFilterChange('location', loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                localFilters.location === loc
                  ? 'bg-[#132E20] text-white border-[#132E20] shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-300'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="border-t border-stone-100 pt-5 space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          Quality Guarantees
        </label>

        <button
          type="button"
          onClick={() => handleFilterChange('verifiedFarmersOnly', !localFilters.verifiedFarmersOnly)}
          className={`w-full text-left flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
            localFilters.verifiedFarmersOnly
              ? 'bg-[#132E20] border-[#132E20] text-white shadow-lg'
              : 'bg-stone-50 border-stone-200 hover:border-emerald-300 text-[#132E20]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
              localFilters.verifiedFarmersOnly ? 'bg-[#D97736] text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold">Verified Farmers Only</p>
              <p className={`text-[10px] ${localFilters.verifiedFarmersOnly ? 'text-white/80' : 'text-stone-500'}`}>KYC verified growers</p>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
            localFilters.verifiedFarmersOnly ? 'bg-[#D97736] border-[#D97736] text-white' : 'border-stone-300 bg-white'
          }`}>
            {localFilters.verifiedFarmersOnly && <Check size={12} strokeWidth={3} />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('organicOnly', !localFilters.organicOnly)}
          className={`w-full text-left flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
            localFilters.organicOnly
              ? 'bg-[#132E20] border-[#132E20] text-white shadow-lg'
              : 'bg-stone-50 border-stone-200 hover:border-emerald-300 text-[#132E20]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
              localFilters.organicOnly ? 'bg-[#D97736] text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Leaf size={18} />
            </div>
            <div>
              <p className="text-xs font-bold">Certified Organic</p>
              <p className={`text-[10px] ${localFilters.organicOnly ? 'text-white/80' : 'text-stone-500'}`}>Chemical-free batches</p>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
            localFilters.organicOnly ? 'bg-[#D97736] border-[#D97736] text-white' : 'border-stone-300 bg-white'
          }`}>
            {localFilters.organicOnly && <Check size={12} strokeWidth={3} />}
          </div>
        </button>
      </div>

      {}
      <div className="space-y-2 pt-2">
        {onCloseMobile ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full min-h-[48px] bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            onClick={onCloseMobile}
          >
            <span>Apply Filters ({activeCount})</span>
          </Button>
        ) : (
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-2xl text-xs font-bold text-stone-600 hover:text-emerald-800 bg-stone-100 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
          >
            <RotateCcw size={14} /> Reset All Filters
          </button>
        )}
      </div>
    </div>
  );
}
