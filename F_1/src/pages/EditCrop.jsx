import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import PageTransition from '../components/common/PageTransition.jsx';
import ScrollAnimation from '../components/common/ScrollAnimation.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';
import { AlertCircle, CheckCircle, ArrowLeft, Edit2, Upload, X } from 'lucide-react';
import { cropService } from '../services/appService.js';

/**
 * Edit Crop Listing Page
 * Allows farmers to edit their existing crop listings
 */
export default function EditCrop() {
  const { navigate, params } = useRouter();
  const cropId = params?.cropId;

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
    availability: 'available',
  });

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]); // track existing URLs kept

  // Fetch existing crop data
  useEffect(() => {
    const fetchCrop = async () => {
      try {
        setLoading(true);
        const data = await cropService.getCropById(cropId);
        const cropData = data.crop || data.data;

        setCrop(cropData);

        // Populate form with existing data
        setFormData({
          cropName: cropData.cropName || '',
          cropType: cropData.cropType || 'vegetables',
          category: cropData.category || 'vegetables',
          price: cropData.price || '',
          quantity: cropData.quantity || '',
          unit: cropData.unit || 'kg',
          description: cropData.description || '',
          pickupLocation: cropData.pickupLocation || '',
          contactNumber: cropData.contactNumber || '',
          specifications: typeof cropData.specifications === 'object'
            ? JSON.stringify(cropData.specifications, null, 2)
            : (cropData.specifications || ''),
          availability: cropData.availability || 'available',
        });

        // Set existing image previews and track existing URLs for sync
        if (cropData.images && cropData.images.length > 0) {
          const urls = cropData.images.map(img =>
            typeof img === 'string' ? img : img.url || img
          );
          setImagePreview(urls);
          setExistingImageUrls(urls);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching crop:', err);
        setError('Failed to load crop data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (cropId) {
      fetchCrop();
    }
  }, [cropId]);

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

    const totalImages = imagePreview.length + newImages.length + files.length;
    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);
    setNewImages(prev => [...prev, ...files]);
    setError(null);
  };

  const removeImage = (index) => {
    const removedUrl = imagePreview[index];
    // If it's a new image (beyond existing URLs), revoke blob URL
    const existingCount = existingImageUrls.length;
    if (index >= existingCount) {
      if (removedUrl && removedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removedUrl);
      }
      const newIndex = index - existingCount;
      setNewImages(prev => prev.filter((_, i) => i !== newIndex));
    } else {
      // This was an existing image URL — remove from kept list
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    }
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const updateData = {
        cropName: formData.cropName,
        cropType: formData.cropType,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        description: formData.description,
        pickupLocation: formData.pickupLocation,
        contactNumber: formData.contactNumber,
        specifications: formData.specifications ? (() => {
          try { return JSON.parse(formData.specifications); } catch { return formData.specifications; }
        })() : {},
        availability: formData.availability,
      };

      // Always send existing image URLs so backend knows which were kept/removed
      updateData.existingImageUrls = existingImageUrls;

      let response;
      // If there are new images, use FormData
      if (newImages.length > 0) {
        const formDataObj = new FormData();
        Object.keys(updateData).forEach(key => {
          if (key === 'specifications' || key === 'existingImageUrls') {
            formDataObj.append(key, JSON.stringify(updateData[key]));
          } else {
            formDataObj.append(key, updateData[key]);
          }
        });
        newImages.forEach(file => formDataObj.append('images', file));
        response = await cropService.updateCropWithFiles(cropId, formDataObj);
      } else {
        // JSON edit (no new images) — use regular api (not directApi) for token refresh support
        response = await cropService.updateCrop(cropId, updateData);
      }

      // Dispatch global event so cart & wishlist contexts refresh their cached data
      const updatedCrop = (response?.crop) || { _id: cropId, ...updateData };
      window.dispatchEvent(new CustomEvent('crop-updated', { detail: { crop: updatedCrop } }));

      setSuccess('Crop updated successfully!');
      setTimeout(() => {
        navigate('/farmer/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating crop:', err);
      setError(err?.message || err.message || 'Failed to update crop. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute roles="farmer">
        <PageTransition>
          <SkeletonLoader variant="page" />
        </PageTransition>
      </ProtectedRoute>
    );
  }

  if (!crop) {
    return (
      <ProtectedRoute roles="farmer">
        <PageTransition>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 flex items-center justify-center pt-28 pb-8">
            <Card className="max-w-md w-full p-8 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Crop Not Found</h2>
              <p className="text-gray-600 mb-6">The crop you're trying to edit doesn't exist.</p>
              <Button variant="primary" onClick={() => navigate('/farmer/dashboard')}>
                Return to Dashboard
              </Button>
            </Card>
          </div>
        </PageTransition>
      </ProtectedRoute>
    );
  }

  return (
    <ErrorBoundary>
    <ProtectedRoute roles="farmer">
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 pt-28 pb-8">
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
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 flex items-center gap-4">
                <Edit2 size={40} className="text-blue-200" />
                <div>
                  <h1 className="text-3xl font-bold">Edit Crop Listing</h1>
                  <p className="text-blue-100 mt-1">Update your crop details</p>
                </div>
              </div>
            </ScrollAnimation>

            {/* Success Message */}
            {success && (
              <ScrollAnimation className="scroll-slide mb-6">
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <p className="text-green-800 font-semibold">{success}</p>
                </div>
              </ScrollAnimation>
            )}

            {/* Crop Form */}
            <ScrollAnimation className="scroll-slide mb-8">
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Crop Details</h2>

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
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                      placeholder="e.g., Organic Tomatoes"
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
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
                      placeholder="Describe your crop, harvesting method, storage conditions, etc."
                      rows="4"
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">
                      Crop Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="edit-crop-image-upload"
                      />
                      <label htmlFor="edit-crop-image-upload" className="cursor-pointer">
                        <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-600 font-medium">Click to add more images</p>
                        <p className="text-gray-400 text-sm mt-1">Max 5 images total</p>
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

                  {/* Availability */}
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">
                      Availability
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                    >
                      <option value="available">Available</option>
                      <option value="not_available">Not Available</option>
                    </select>
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
                      placeholder='e.g., {"variety": "Hybrid", "grade": "A"}'
                      rows="3"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none resize-none transition-colors font-mono text-sm"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/farmer/dashboard')}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
    </ErrorBoundary>
  );
}
