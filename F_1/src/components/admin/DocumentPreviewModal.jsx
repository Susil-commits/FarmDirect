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
    <div className="fixed inset-0 bg-[#132E20]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-[32px] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#FBF8F3]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">KYC VERIFICATION PREVIEW</span>
            <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">{document.fileName}</h3>
            <p className="text-xs text-stone-500">
              {document.type || 'Document'} &bull; {formatFileSize(document.fileSize)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition cursor-pointer text-stone-400 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-auto max-h-[75vh]">
          {isImage && !imageError ? (
            <img
              src={resolveDocUrl(document.url)}
              alt={document.fileName}
              className="w-full h-auto rounded-2xl border border-stone-200 shadow-md"
              onError={() => setImageError(true)}
            />
          ) : isPdf ? (
            <iframe
              src={getProxyUrl(document.url)}
              className="w-full rounded-2xl border border-stone-200"
              style={{ height: 'calc(80vh - 160px)', minHeight: '480px' }}
              title={document.fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <FileText size={56} className="mb-3 text-[#D97736]" />
              <p className="font-serif-display text-2xl font-normal text-[#132E20]">Document Preview</p>
              <p className="text-xs text-stone-500 mt-1">This file format can be reviewed directly in admin portal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

