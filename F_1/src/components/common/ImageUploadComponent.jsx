/**
 * Example: Image Upload Component using Cloudinary via Backend
 * Shows how to handle file uploads in your React components
 */

import { useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import uploadService from '../../services/uploadService';
import Button from './Button';
import Card from './Card';

export default function ImageUploadComponent({ onUploadSuccess, maxFiles = 5 }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validation
    if (selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      setError('Total file size exceeds 50MB limit');
      return;
    }

    setFiles(selectedFiles);
    setError(null);

    // Generate previews
    const newPreviews = selectedFiles.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2),
            preview: reader.result,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPreviews).then(setPreviews);
  };

  /**
   * Handle upload to Cloudinary (via backend)
   */
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadService.uploadCropImages(files);

      setSuccess(true);
      setFiles([]);
      setPreviews([]);

      // Call parent component callback with uploaded URLs
      if (onUploadSuccess) {
        onUploadSuccess(result.data.images);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Remove file from selection
   */
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Images to Cloudinary</h3>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check size={20} className="text-green-600" />
            <p className="text-green-700 text-sm">✓ Files uploaded successfully to Cloudinary!</p>
          </div>
        )}

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Images (Max {maxFiles}, 50MB total)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPG, PNG, GIF, WebP
          </p>
        </div>

        {/* Selected Files Preview */}
        {previews.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3">Selected Files ({previews.length})</h4>
            <div className="space-y-2 mb-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Image Preview */}
                    {preview.type.startsWith('image/') && (
                      <img
                        src={preview.preview}
                        alt={preview.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    {/* File Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {preview.name}
                      </p>
                      <p className="text-xs text-gray-600">{preview.size} MB</p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading || previews.length === 0}
              variant="primary"
              className="w-full"
            >
              {uploading ? (
                <>
                  <Upload size={18} className="animate-pulse" />
                  Uploading to Cloudinary...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload {previews.length} {previews.length === 1 ? 'File' : 'Files'} to Cloudinary
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-2">
              💡 Files are optimized and stored on Cloudinary CDN for fast delivery worldwide
            </p>
          </div>
        )}

        {/* Empty State */}
        {previews.length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Select images to upload</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Usage in your component:
 * 
 * import ImageUploadComponent from './ImageUploadComponent';
 * 
 * <ImageUploadComponent 
 *   onUploadSuccess={(urls) => {
 *     console.log('Uploaded to Cloudinary:', urls);
 *     // Store URLs in your form state
 *     setFormData(prev => ({ ...prev, images: urls }));
 *   }}
 *   maxFiles={5}
 * />
 */
