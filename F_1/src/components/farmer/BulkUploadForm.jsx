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
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <div className="p-6 bg-blue-50 border-l-4 border-blue-600">
          <h3 className="font-bold text-blue-900 mb-3">CSV Upload Guide</h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li>✓ Required columns: <strong>cropName, category, price, quantity, description</strong></li>
            <li>✓ Optional columns: <strong>unit, discount</strong></li>
            <li>✓ Maximum 1000 crops per upload</li>
            <li>✓ File size limit: 5 MB</li>
            <li>✓ Use comma (,) as delimiter</li>
          </ul>
          <Button
            onClick={onDownloadTemplate}
            className="mt-4 flex items-center gap-2"
            variant="primary"
          >
            <Download size={16} />
            Download Template
          </Button>
        </div>
      </Card>

      {/* Upload Area */}
      <Card>
        <div className="p-6">
          <h3 className="font-bold mb-4">Upload CSV File</h3>
          
          <form onSubmit={handleUpload}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-green-600 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-semibold text-gray-900 mb-1">
                {file ? file.name : 'Drag and drop your CSV file here'}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                or click to select a file
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer"
              >
                <Button as="span" variant="secondary" size="sm">
                  Select File
                </Button>
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
      </Card>

      {/* Upload Result */}
      {result && (
        <Card>
          <div className={`p-6 border-l-4 ${
            result.summary.inserted > 0
              ? 'border-green-600 bg-green-50'
              : 'border-yellow-600 bg-yellow-50'
          }`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              {result.summary.inserted > 0 ? (
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
                <p className="text-2xl font-bold text-gray-900">{result.summary.total}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Imported</p>
                <p className="text-2xl font-bold text-green-600">{result.summary.inserted}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
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

            {result.summary.inserted > 0 && (
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
Tomato,Vegetables,50,100,kg,Fresh red tomatoes,10
Carrot,Vegetables,30,200,kg,Organic carrots,5
Apple,Fruits,80,150,kg,Sweet red apples,0
Wheat,Grains,25,500,kg,Fresh wheat grains,0`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
