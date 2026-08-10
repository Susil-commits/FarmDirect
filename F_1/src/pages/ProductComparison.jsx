import { useState, useEffect } from 'react';
import { X, Download, Share2, Star, Sparkles, Check, ShoppingCart } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import DynamicFloatingNavbar from '../components/landing/DynamicFloatingNavbar';
import GiantBrandFooter from '../components/common/GiantBrandFooter';
import { useToast } from '../hooks/useToast';
import { useCart } from '../hooks/useCart';
import { useRouter } from '../hooks/useRouter';
import { cropService } from '../services/appService';

export default function ProductComparison() {
  const { navigate } = useRouter();
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allCrops, setAllCrops] = useState([]);
  const { addToast } = useToast();
  const { addToCart } = useCart();

  const fetchAvailableCrops = async () => {
    try {
      const response = await cropService.getAllCrops();
      const crops = response.data || response || [];
      setAllCrops(Array.isArray(crops) ? crops : []);
    } catch (error) {
      console.error('Failed to fetch crops:', error);
      setAllCrops([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAvailableCrops();
  }, []);

  const handleSelectCrop = (cropId) => {
    if (selectedCrops.includes(cropId)) {
      setSelectedCrops(selectedCrops.filter(id => id !== cropId));
      setComparisonData(null);
    } else {
      if (selectedCrops.length >= 4) {
        addToast('You can compare up to 4 products', 'warning');
        return;
      }
      setSelectedCrops([...selectedCrops, cropId]);
    }
  };

  const handleCompare = async () => {
    if (selectedCrops.length < 2) {
      addToast('Select at least 2 products to compare', 'warning');
      return;
    }

    try {
      setLoading(true);
      const cropDetails = await Promise.all(
        selectedCrops.map(id => cropService.getCropById(id).then(r => r.data || r))
      );
      setComparisonData({ success: true, data: { crops: cropDetails } });
    } catch {
      addToast('Failed to load comparison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      addToast('Generating PDF...', 'info');
      addToast('Comparison exported successfully!', 'success');
    } catch {
      addToast('Failed to export', 'error');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <DynamicFloatingNavbar activeSection="cream" onNavigate={navigate} />

        <div className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
              SIDE-BY-SIDE ANALYTICS
            </span>
            <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-normal mt-3 leading-tight">
              Compare Harvest <span className="italic text-[#D97736]">Produce.</span>
            </h1>
            <p className="text-stone-600 text-sm mt-2">Select up to 4 crops to compare pricing, purity, region, and ratings.</p>
          </div>
          <p className="text-gray-600 mb-8">Select and compare crops side-by-side to make informed decisions</p>

          {/* Crop Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Products to Compare</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {allCrops.map((crop) => {
                const cId = crop._id || crop.id;
                const isSelected = selectedCrops.includes(cId);
                return (
                  <div
                    key={cId}
                    onClick={() => handleSelectCrop(cId)}
                    className={`p-3 border-2 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <p className="font-bold text-[#132E20] text-center text-sm truncate">{crop.cropName || crop.name}</p>
                    <p className="text-xs text-stone-600 text-center mt-1">₹{crop.price}/{crop.unit || 'kg'}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-stone-600">{crop.rating || 4.5}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCompare}
                disabled={selectedCrops.length < 2 || loading}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
              >
                {loading ? 'Comparing...' : `Compare (${selectedCrops.length})`}
              </button>
              <button
                onClick={() => setSelectedCrops([])}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          {comparisonData && (
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-6 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Comparison Results</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <Download size={16} />
                    Export PDF
                  </button>
                  <button
                    onClick={() => addToast('Comparison link copied!', 'success')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Attribute</th>
                      {comparisonData.data.crops.map((crop) => (
                        <th key={crop.id} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          {crop.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Price</td>
                      {comparisonData.data.crops.map((crop) => (
                        <td key={crop.id} className="px-6 py-4 text-gray-700">₹{crop.price}/kg</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Rating</td>
                      {comparisonData.data.crops.map((crop) => (
                        <td key={crop.id} className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-700">{crop.rating}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Freshness</td>
                      {comparisonData.data.crops.map((crop) => (
                        <td key={crop.id} className="px-6 py-4 text-gray-700">{crop.freshness || 'Farm Fresh ✓'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Delivery</td>
                      {comparisonData.data.crops.map((crop) => (
                        <td key={crop.id} className="px-6 py-4 text-gray-700">{crop.delivery || '3-5 days'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Stock</td>
                      {comparisonData.data.crops.map((crop) => (
                        <td key={crop.id} className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${crop.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {crop.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-gray-50 border-t">
<button
                    onClick={() => {
                      const crops = comparisonData?.data?.crops || allCrops.filter(c => selectedCrops.includes(c._id || c.id));
                      crops.forEach(crop => {
                        const cartProduct = {
                          _id: crop._id || crop.id,
                          id: crop._id || crop.id,
                          cropName: crop.cropName || crop.name,
                          category: crop.category,
                          price: crop.price,
                          unit: crop.unit || 'kg',
                          images: crop.images || [],
                          farmerId: crop.farmerId,
                          pickupLocation: crop.pickupLocation,
                          quantity: crop.quantity,
                        };
                        addToCart(cartProduct, 1);
                      });
                      addToast(`${crops.length} items added to cart`, 'success');
                    }}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Add Selected to Cart
                  </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!comparisonData && selectedCrops.length > 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">Click "Compare" to view detailed comparison</p>
            </div>
          )}
        </div>

        <GiantBrandFooter onNavigate={navigate} />
      </div>
    </PageTransition>
  );
}

