import { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import farmerService from '../../services/farmerService';

export default function BulkUploadForm({ onUploadSuccess, onDownloadTemplate }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop a CSV file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setResult(null);

      const result = await farmerService.bulkUploadCrops(file);
      
      setResult({
        success: result.success,
        summary: result.summary,
        errors: result.errors || []
      });

      if (result.success && result.summary.inserted > 0) {
        // Refresh parent data after 2 seconds
        setTimeout(() => {
          onUploadSuccess();
        }, 2000);
      }

      // Clear file input
      setFile(null);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans-body text-[#132E20]">
      {/* Instructions Card */}
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center font-bold">
            <Download size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97736]">BULK LISTING GUIDE</span>
            <h3 className="font-serif-display text-2xl font-normal text-[#132E20]">CSV Crop Import Standard</h3>
          </div>
        </div>
        <ul className="text-stone-600 text-xs space-y-1.5 mb-4 pl-1">
          <li className="flex items-center gap-2">✓ Required columns: <strong className="text-[#132E20]">cropName, category, price, quantity, description</strong></li>
          <li className="flex items-center gap-2">✓ Optional columns: <strong className="text-[#132E20]">unit, discount</strong></li>
          <li className="flex items-center gap-2">✓ Maximum 1,000 crops per single batch upload</li>
          <li className="flex items-center gap-2">✓ Standard file size limit: 5 MB (.csv format)</li>
        </ul>
        <button
          onClick={onDownloadTemplate}
          className="py-2.5 px-5 bg-[#132E20] hover:bg-[#1B3B2B] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Download size={16} />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Upload Area */}
      <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-[28px] p-6 shadow-xl">
        <h3 className="font-serif-display text-2xl font-normal text-[#132E20] mb-4">Upload Crop CSV Batch</h3>
        
        <form onSubmit={handleUpload}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-[#D97736] bg-[#D97736]/10' 
                : 'border-stone-200 hover:border-stone-400 bg-stone-50/50'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-3 text-[#D97736]" />
            <p className="font-bold text-[#132E20] text-sm mb-1">
              {file ? file.name : 'Drag & drop your crop CSV batch file here'}
            </p>
            <p className="text-stone-500 text-xs mb-4">
              or browse from your local file directory
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <span className="inline-block py-2.5 px-5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl transition">
                Browse Files
              </span>
            </label>
          </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {file && !error && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-medium">{file.name}</p>
                  <p className="text-green-700 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                type="submit"
                disabled={!file || uploading}
                className="flex items-center gap-2"
                variant="primary"
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </Button>
              
              {file && (
                <Button
                  onClick={() => {
                    setFile(null);
                    setError(null);
                    setResult(null);
                  }}
                  variant="secondary"
                  type="button"
                >
                  <X size={16} />
                  Clear
                </Button>
              )}
            </div>
          </form>
        </div>

      {/* Upload Result */}
      {result && (
        <Card>
          <div className={`p-6 border-l-4 ${
            result.summary?.inserted > 0
              ? 'border-green-600 bg-green-50'
              : 'border-yellow-600 bg-yellow-50'
          }`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              {result.summary?.inserted > 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-900">Upload Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-900">Upload Results</span>
                </>
              )}
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">{result.summary?.total ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Imported</p>
                <p className="text-2xl font-bold text-green-600">{result.summary?.inserted ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-600">{result.summary?.failed ?? 0}</p>
              </div>
            </div>

            {/* Error Details */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-3">
                  Error Details (Showing first 50)
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="p-3 bg-white rounded border border-red-100">
                      <p className="font-mono text-sm text-red-700">
                        Row {err.row}: {err.error}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.summary?.inserted > 0 && (
              <p className="mt-4 text-sm text-gray-600">
                ✓ {result.summary.inserted} crops have been added to your farm. 
                They are pending admin review.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* CSV Format Example */}
      <Card>
        <div className="p-6">
          <h3 className="font-bold mb-4">CSV Format Example</h3>
          <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs text-gray-800 font-mono">
{`cropName,category,price,quantity,unit,description,discount
Tomato,vegetables,50,100,kg,Fresh red tomatoes,10
Carrot,vegetables,30,200,kg,Organic carrots,5
Apple,fruits,80,150,kg,Sweet red apples,0
Wheat,grains,25,500,kg,Fresh wheat grains,0`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
