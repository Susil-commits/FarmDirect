import React, { useState } from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../../utils/formatters';

// Resolve document URL: prepend backend origin for relative /uploads/ paths,
// use cloud URLs directly, and route PDFs through the backend proxy
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const resolveDocUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return getImageUrl(url) || url;
};

const getProxyUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/admin/documents/proxy?url=${encodeURIComponent(url)}`;
};

/**
 * DocumentPreviewModal - Clean inline document preview (no download, no external links)
 * Used for viewing KYC documents, farm images, and crop images.
 * Supports: images (img tag) and PDFs (iframe via backend proxy).
 */
export default function DocumentPreviewModal({ document, onClose }) {
  const [imageError, setImageError] = useState(false);

  if (!document) return null;


  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = /\.pdf$/i.test(document.fileName || '') || document.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{document.fileName}</h3>
            <p className="text-xs text-gray-500">
              {document.type || 'Document'} • {formatFileSize(document.fileSize)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {isImage && !imageError ? (
            <img
              src={resolveDocUrl(document.url)}
              alt={document.fileName}
              className="w-full h-auto rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : isPdf ? (
            <iframe
              src={getProxyUrl(document.url)}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: 'calc(90vh - 160px)', minHeight: '500px' }}
              title={document.fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={64} className="mb-4" />
              <p className="font-semibold text-gray-600">Document Preview</p>
              <p className="text-sm mt-1">This file type cannot be previewed inline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
