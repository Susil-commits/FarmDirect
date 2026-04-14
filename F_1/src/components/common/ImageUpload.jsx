import React, { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import '../styles/ImageUpload.css';

/**
 * ImageUpload Component
 * Handles file selection, preview, and upload to DigitalOcean Spaces
 */
const ImageUpload = ({ 
  onUploadSuccess, 
  folder = 'uploads',
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  label = 'Upload Image',
}) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setError(null);
    setFileName(file.name);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];

    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      // Upload to backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      // Success
      setSuccess(true);
      onUploadSuccess(response.data.url);
      
      // Reset form
      setTimeout(() => {
        setPreview(null);
        setFileName(null);
        fileInput.value = '';
        setSuccess(false);
      }, 2000);

    } catch (err) {
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Upload failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  return (
    <div className="image-upload-wrapper">
      <form onSubmit={handleUpload} className="image-upload-form">
        {/* File Input */}
        <label className="file-input-label">
          <div className="file-input-content">
            <Upload size={32} className="upload-icon" />
            <p className="label-text">{label}</p>
            <p className="sublabel-text">
              {preview ? 'Ready to upload' : 'or drag and drop'}
            </p>
            <p className="file-info-text">
              PNG, JPG, GIF, WebP (max {maxSize / 1024 / 1024}MB)
            </p>
          </div>
          <input
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileChange}
            disabled={loading}
            className="file-input-hidden"
          />
        </label>

        {/* Preview */}
        {preview && (
          <div className="preview-container">
            <img src={preview} alt="preview" className="preview-image" />
            <div className="preview-info">
              <p className="file-name">{fileName}</p>
              {!success && <p className="ready-text">Ready to upload</p>}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            <CheckCircle size={20} />
            <span>Image uploaded successfully!</span>
          </div>
        )}

        {/* Progress Bar */}
        {loading && uploadProgress > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">{uploadProgress}%</p>
          </div>
        )}

        {/* Button Group */}
        <div className="button-group">
          {preview && !success ? (
            <>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary"
              >
                {loading ? 'Uploading...' : 'Upload Image'}
              </button>
              <button 
                type="button" 
                onClick={handleReset}
                disabled={loading}
                className="btn btn-secondary"
              >
                <X size={18} />
                Cancel
              </button>
            </>
          ) : (
            <button 
              type="button" 
              onClick={handleReset}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ImageUpload;
