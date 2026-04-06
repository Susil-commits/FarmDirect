import React, { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';

/**
 * FileInput Component
 * Handles file upload with photo preview and camera capture
 */
export default function FileInput({
  label = 'Upload Photo',
  name = 'photo',
  onChange = () => {},
  accept = 'image/*',
  maxSize = 5, // MB
  preview = null,
  error = null,
  helperText = null,
  required = false,
  className = '',
}) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(preview);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    setUploadError(null);
    return true;
  };

  const handleFile = (file) => {
    if (!validateFile(file)) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      onChange({
        target: {
          name,
          files: [file],
          value: reader.result, // Also include base64 for easy storage
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleClearPreview = () => {
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange({
      target: {
        name,
        files: [],
        value: null,
      },
    });
  };

  const displayError = uploadError || error;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative w-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
            />
            <button
              type="button"
              onClick={handleClearPreview}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition"
              title="Remove photo"
            >
              <X size={18} />
            </button>
            <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
              ✓ Photo selected and ready to upload
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-green-500 bg-green-50'
              : displayError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            name={name}
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            required={required}
          />

          <div className="flex flex-col items-center justify-center">
            <Upload
              size={40}
              className={`mb-3 ${
                displayError ? 'text-red-500' : 'text-gray-400'
              }`}
            />
            <p className="text-base font-semibold text-gray-700 mb-1">
              Drag and drop your photo here
            </p>
            <p className="text-sm text-gray-600 mb-4">or click to select from your device</p>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:border-green-400 transition">
              <Camera size={16} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">Choose file</span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Supported formats: JPG, PNG (Max {maxSize}MB)
            </p>
          </div>
        </div>
      )}

      {displayError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          ✗ {displayError}
        </div>
      )}

      {helperText && !displayError && (
        <div className="mt-2 text-sm text-gray-600">
          {helperText}
        </div>
      )}
    </div>
  );
}
