import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation.jsx';
import { AlertCircle, CheckCircle, ArrowLeft, Leaf, Upload, X, Image, Sparkles, Info, AlertTriangle } from 'lucide-react';
import { cropService } from '../services/appService.js';
import { getListingDraft } from '../services/aiChatService.js';
import MarketPriceBand from '../components/crops/MarketPriceBand.jsx';

export default function CreateCrop() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    cropName: '',
    cropType: 'vegetables',
    category: 'vegetables',
    price: '',
    quantity: '',
    unit: 'kg',
    description: '',
    pickupLocation: '',
    contactNumber: '',
    specifications: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [dismissAiBanner, setDismissAiBanner] = useState(false);
  const [lastDraftGrade, setLastDraftGrade] = useState('A');
  const [lastDraftConfidence, setLastDraftConfidence] = useState(90);

  const kycVerified = user?.kycStatus === 'verified';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const analyzeImageWithAi = async (file) => {
    if (!file) return;
    try {
      setAiDraftLoading(true);
      setError(null);

      // Read file as base64 data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const draft = await getListingDraft({
        imageBase64: dataUrl,
        cropNameHint: formData.cropName || file.name || undefined,
      });

      if (draft) {
        setFormData((prev) => ({
          ...prev,
          cropName: prev.cropName || draft.cropName || '',
          category: draft.category || prev.category,
          cropType: draft.cropType || prev.cropType,
          description: prev.description || draft.description || '',
          price: prev.price || (draft.suggestedPrice ? String(draft.suggestedPrice) : ''),
          specifications: prev.specifications || JSON.stringify({
            qualityGrade: draft.qualityGrade || 'A',
            ripeness: draft.ripeness || 'Freshly Harvested',
            colour: draft.colour || 'Natural',
            size: draft.size || 'Medium',
            aiConfidence: draft.confidence ? Math.round(draft.confidence * 100) : 90,
          }, null, 2),
        }));

        setAiReview({
          looksLikeProduce: draft.looksLikeProduce !== false,
          issues: draft.issues || [],
          confidence: draft.confidence || 0.9,
        });

        setLastDraftGrade(draft.qualityGrade || 'A');
        setLastDraftConfidence(draft.confidence ? Math.round(draft.confidence * 100) : 90);
        setAiSuggested(true);
        setDismissAiBanner(false);
      }
    } catch (err) {
      console.warn('AI listing draft suggestion error:', err);
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalImages = formData.images.length + files.length;
    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
    setError(null);

    // Auto-trigger AI Produce Vision Scanner on first uploaded image
    if (files[0]) {
      analyzeImageWithAi(files[0]);
    }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreview[index]);
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!kycVerified) {
      setError('Please complete your KYC verification before listing crops');
      return;
    }

    if (!formData.cropName || !formData.price || !formData.quantity || !formData.pickupLocation || !formData.contactNumber) {
      setError('Please fill in all required fields: Crop Name, Price, Quantity, Pickup Location, and Contact Number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = new FormData();
      submitData.append('cropName', formData.cropName);
      submitData.append('cropType', formData.cropType);
      submitData.append('category', formData.category);
      submitData.append('price', parseFloat(formData.price));
      submitData.append('quantity', parseInt(formData.quantity));
      submitData.append('unit', formData.unit);
      submitData.append('description', formData.description);
      submitData.append('pickupLocation', formData.pickupLocation);
      submitData.append('contactNumber', formData.contactNumber);
      submitData.append('specifications', formData.specifications || '{}');

      if (aiReview) {
        submitData.append('aiReview', JSON.stringify(aiReview));
      }

      formData.images.forEach((file) => {
        submitData.append('images', file);
      });

      await cropService.createCrop(submitData);

      setSuccess('Crop listed successfully!');
      setTimeout(() => {
        navigate('/farmer/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Failed to create crop:', err);
      setError(err?.message || err.message || 'Failed to create crop listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute roles="farmer">
      <PageTransition>
        <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body px-4 pt-28 pb-16 relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            {}
            <ScrollAnimation className="scroll-slide mb-6">
              <button
                onClick={() => navigate('/farmer/dashboard')}
                className="flex items-center gap-2 text-stone-700 hover:text-[#132E20] font-bold text-xs uppercase tracking-wider transition-colors bg-white/90 px-4 py-2 rounded-full border border-stone-200 shadow-sm cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            </ScrollAnimation>

            {}
            <ScrollAnimation className="scroll-slide mb-8">
              <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[32px] p-6 sm:p-8 flex items-center gap-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#132E20] to-[#1B3B2B] text-white flex items-center justify-center shadow-lg text-2xl">
                  🌾
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">NEW LISTING</span>
                  <h1 className="font-serif-display text-3xl sm:text-4xl font-normal text-[#132E20]">List Your Harvest</h1>
                  <p className="text-stone-500 text-xs mt-0.5">Share your crop details with direct marketplace buyers</p>
                </div>
              </div>
            </ScrollAnimation>

            {}
            {!kycVerified && (
              <ScrollAnimation className="scroll-slide mb-8">
                <Card className="p-6 bg-yellow-50 border-2 border-yellow-300">
                  <div className="flex items-start gap-4">
                    <AlertCircle size={24} className="text-yellow-600 mt-1" />
                    <div>
                      <h3 className="font-bold text-yellow-900 text-lg">KYC Verification Required</h3>
                      <p className="text-yellow-800 mt-1">
                        You need to complete your KYC verification before you can list crops.
                        Your current KYC status: <strong>{user?.kycStatus || 'Not Submitted'}</strong>
                      </p>
                      <button
                        onClick={() => navigate('/verification')}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                      >
                        Complete KYC Now
                      </button>
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>
            )}

            {}
            {kycVerified && (
              <ScrollAnimation className="scroll-slide mb-6">
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900">KYC Verified ✓</h4>
                    <p className="text-sm text-green-800">You're ready to list your crops</p>
                  </div>
                </div>
              </ScrollAnimation>
            )}

            {/* Crop Form */}
            {kycVerified && (
              <ScrollAnimation className="scroll-slide mb-8">
                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Crop Details</h2>

                  {/* Success Message */}
                  {success && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600" />
                        <p className="text-green-800 font-semibold">{success}</p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-600 mt-0.5" />
                        <p className="text-red-800 font-semibold">{error}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Crop Images & AI Vision Scanner */}
                    <div className="bg-gradient-to-br from-emerald-50/70 via-stone-50/80 to-teal-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-stone-900 font-bold flex items-center gap-2 text-sm">
                          <Upload size={16} className="text-emerald-700" />
                          <span>Crop Photos & AI Produce Scanner</span>
                        </label>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles size={12} /> Smart Autofill
                        </span>
                      </div>

                      <div className="border-2 border-dashed border-emerald-300/80 rounded-xl p-6 text-center bg-white/80 hover:bg-emerald-50/50 hover:border-emerald-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="crop-image-upload"
                        />
                        <label htmlFor="crop-image-upload" className="cursor-pointer block">
                          <Upload size={32} className="mx-auto mb-2 text-emerald-600" />
                          <p className="text-stone-800 font-semibold text-sm">Upload crop photograph</p>
                          <p className="text-stone-500 text-xs mt-1">
                            AgriVision AI will automatically detect crop variety, quality grade & market pricing
                          </p>
                        </label>
                      </div>

                      {/* Image Previews */}
                      {imagePreview.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-stone-700">Uploaded Photos ({imagePreview.length}/5)</span>
                            {formData.images[0] && (
                              <button
                                type="button"
                                onClick={() => analyzeImageWithAi(formData.images[0])}
                                disabled={aiDraftLoading}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs cursor-pointer"
                              >
                                <Sparkles size={12} /> {aiDraftLoading ? 'Analyzing...' : 'Re-analyze with AI'}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {imagePreview.map((preview, index) => {
                              const safeSrc = typeof preview === 'string' && /^(data:image\/|blob:|https?:\/\/|\/)/i.test(preview.trim()) ? preview.trim() : '';
                              return (
                                <div key={index} className="relative group">
                                  <img
                                    src={safeSrc}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border-2 border-emerald-100 shadow-xs"
                                  />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        </div>
                      )}

                      {/* AI Draft Loading Indicator */}
                      {aiDraftLoading && (
                        <div className="mt-3 p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 animate-pulse">
                          <Sparkles size={18} className="text-emerald-700 animate-spin shrink-0" />
                          <div>
                            <p className="font-bold text-xs">Analyzing Produce Photo with AI...</p>
                            <p className="text-[11px] text-emerald-700">Detecting crop type, quality grade, freshness, and optimal market pricing.</p>
                          </div>
                        </div>
                      )}

                      {/* AI Suggested Banner (Dismissible) */}
                      {aiSuggested && !dismissAiBanner && (
                        <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-300 rounded-xl flex items-start justify-between gap-3 text-emerald-950 shadow-xs">
                          <div className="flex items-start gap-2">
                            <Sparkles size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-xs">Suggested by AI (Grade {lastDraftGrade} · {lastDraftConfidence}% confidence)</p>
                              <p className="text-[11px] text-emerald-800 mt-0.5">
                                Form fields have been suggested from your photo. You can edit any field before submitting.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDismissAiBanner(true)}
                            className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                            title="Dismiss"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      )}

                      {/* Advisory Sanity Review Banner */}
                      {aiReview && (!aiReview.looksLikeProduce || aiReview.issues?.length > 0) && (
                        <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900">
                          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-xs">Advisory AI Quality Signal</p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Our automated inspector noted: {aiReview.issues?.join(', ') || 'Produce not clearly identified'}. You may still submit, but an admin will review the image before public listing.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Crop Type */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Crop Type *
                      </label>
                      <select
                        name="cropType"
                        value={formData.cropType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                      >
                        <option value="vegetables">Vegetables</option>
                        <option value="crops">Crops (Grains/Cereals)</option>
                      </select>
                    </div>

                    {/* Crop Name */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Crop Name *
                      </label>
                      <input
                        type="text"
                        name="cropName"
                        value={formData.cropName}
                        onChange={handleInputChange}
                        placeholder="e.g., Organic Tomatoes, Basmati Rice"
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                      >
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="grains">Grains</option>
                        <option value="spices">Spices</option>
                        <option value="herbs">Herbs</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Price, Quantity, Unit */}
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-900 font-semibold mb-2">
                            Price per Unit (₹) *
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-900 font-semibold mb-2">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            placeholder="0"
                            min="0"
                            required
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-900 font-semibold mb-2">
                            Unit
                          </label>
                          <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                          >
                            <option value="kg">Kg</option>
                            <option value="quintal">Quintal</option>
                            <option value="ton">Ton</option>
                            <option value="piece">Piece</option>
                            <option value="dozen">Dozen</option>
                            <option value="bundle">Bundle</option>
                          </select>
                        </div>
                      </div>

                      {/* Market Price Guidance Band Bar (T2.3) */}
                      {formData.cropName && (
                        <div className="mt-3">
                          <MarketPriceBand
                            cropName={formData.cropName}
                            currentPrice={formData.price}
                            unit={formData.unit}
                          />
                        </div>
                      )}
                    </div>

                    {/* Pickup Location */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Pickup Location *
                      </label>
                      <input
                        type="text"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        placeholder="e.g., Village Name, Near Landmark, District"
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        placeholder="Your phone number for buyers to contact"
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your crop - variety, quality, harvesting method, storage conditions, etc."
                        rows="4"
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none resize-none transition-colors"
                      />
                    </div>

                    {/* Specifications */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Specifications (optional)
                      </label>
                      <textarea
                        name="specifications"
                        value={formData.specifications}
                        onChange={handleInputChange}
                        placeholder='e.g., {"variety": "Hybrid", "grade": "A", "color": "Red"}'
                        rows="3"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none resize-none transition-colors font-mono text-sm"
                      />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/farmer/dashboard')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Posting...
                          </span>
                        ) : (
                          'Post Crop Listing'
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </ScrollAnimation>
            )}
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
