import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation.jsx';
import { AlertCircle, CheckCircle, ArrowLeft, Leaf, Upload, X, Image } from 'lucide-react';
import { cropService } from '../services/appService.js';

/**
 * Create Crop Listing Page
 * Farmers can create new crop listings after KYC verification
 * No additional verification needed - KYC is the only gate
 */
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

  // Check KYC status
  const kycVerified = user?.kycStatus === 'verified';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images
    const totalImages = formData.images.length + files.length;
    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
    setError(null);
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

    // Validate required fields
    if (!formData.cropName || !formData.price || !formData.quantity || !formData.pickupLocation || !formData.contactNumber) {
      setError('Please fill in all required fields: Crop Name, Price, Quantity, Pickup Location, and Contact Number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build FormData for image upload
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

      // Append images
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <ScrollAnimation className="scroll-slide mb-6">
              <button
                onClick={() => navigate('/farmer/dashboard')}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                <ArrowLeft size={20} /> Back to Dashboard
              </button>
            </ScrollAnimation>

            {/* Hero Section */}
            <ScrollAnimation className="scroll-slide mb-8">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-8 flex items-center gap-4">
                <Leaf size={40} className="text-green-200" />
                <div>
                  <h1 className="text-3xl font-bold">List Your Crop</h1>
                  <p className="text-green-100 mt-1">Share your harvest with the marketplace</p>
                </div>
              </div>
            </ScrollAnimation>

            {/* KYC Status Check */}
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

            {/* KYC Verified Badge */}
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
                    <div className="grid grid-cols-3 gap-4">
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

                    {/* Image Upload */}
                    <div>
                      <label className="block text-gray-900 font-semibold mb-2">
                        Crop Images
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="crop-image-upload"
                        />
                        <label htmlFor="crop-image-upload" className="cursor-pointer">
                          <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-600 font-medium">Click to upload images</p>
                          <p className="text-gray-400 text-sm mt-1">Max 5 images (JPG, PNG, WebP)</p>
                        </label>
                      </div>

                      {/* Image Previews */}
                      {imagePreview.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {imagePreview.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
