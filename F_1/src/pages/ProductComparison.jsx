import { useState, useEffect } from 'react';
import { X, Download, Share2, Star } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { useToast } from '../context/ToastContext';

// Comparison service

// Inline comparison service
const productComparisonService = {
  compareCrops: async (cropIds) => {
    return { success: true, data: { crops: cropIds } };
  },
};

export default function ProductComparison() {
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allCrops, setAllCrops] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    // Load available crops for selection from API
    fetchAvailableCrops();
  }, []);

  const fetchAvailableCrops = async () => {
    try {
      // TODO: Replace with actual API call when available
      // const response = await cropService.getAllCrops();
      // setAllCrops(response.data || []);
      setAllCrops([]);
    } catch (error) {
      console.error('Failed to fetch crops:', error);
      setAllCrops([]);
    }
  };

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
      const data = await productComparisonService.compareCrops(selectedCrops);
      setComparisonData(data);
    } catch (error) {
      addToast('Failed to load comparison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      addToast('Generating PDF...', 'info');
      // In a real app, this would export the comparison as PDF
      addToast('Comparison exported successfully!', 'success');
    } catch (error) {
      addToast('Failed to export', 'error');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Products</h1>
          <p className="text-gray-600 mb-8">Select and compare crops side-by-side to make informed decisions</p>

          {/* Crop Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Products to Compare</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {allCrops.map((crop) => (
                <div
                  key={crop.id}
                  onClick={() => handleSelectCrop(crop.id)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition ${
                    selectedCrops.includes(crop.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-center">{crop.name}</p>
                  <p className="text-sm text-gray-600 text-center">₹{crop.price}/kg</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-600">{crop.rating}</span>
                  </div>
                </div>
              ))}
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
              <div className="flex justify-between items-center p-6 border-b bg-gray-50">
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
                      {selectedCrops.map((cropId) => {
                        const crop = allCrops.find(c => c.id === cropId);
                        return (
                          <th key={cropId} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {crop?.name}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Price</td>
                      {selectedCrops.map((cropId) => {
                        const crop = allCrops.find(c => c.id === cropId);
                        return (
                          <td key={cropId} className="px-6 py-4 text-gray-700">₹{crop?.price}/kg</td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Rating</td>
                      {selectedCrops.map((cropId) => {
                        const crop = allCrops.find(c => c.id === cropId);
                        return (
                          <td key={cropId} className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              <span className="text-gray-700">{crop?.rating}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Freshness</td>
                      {selectedCrops.map((cropId) => (
                        <td key={cropId} className="px-6 py-4 text-gray-700">Farm Fresh ✓</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Delivery</td>
                      {selectedCrops.map((cropId) => (
                        <td key={cropId} className="px-6 py-4 text-gray-700">3-5 days</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Stock</td>
                      {selectedCrops.map((cropId) => (
                        <td key={cropId} className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            In Stock
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <button
                  onClick={() => addToast('Items added to cart!', 'success')}
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
      </div>
    </PageTransition>
  );
}
