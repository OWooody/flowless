'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BatchFormData {
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function CreatePromoCodeBatch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'file' | 'generate'>('manual');
  const [codes, setCodes] = useState<string[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [generateCount, setGenerateCount] = useState(100);
  const [generatePrefix, setGeneratePrefix] = useState('PROMO');
  const [generateLength, setGenerateLength] = useState(8);

  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 0,
    maxUses: 1,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      
      // Parse CSV or text file
      const lines = content.split('\n').filter(line => line.trim());
      const parsedCodes = lines.map(line => line.trim()).filter(code => code.length > 0);
      setCodes(parsedCodes);
    };
    reader.readAsText(file);
  };

  const generateCodes = () => {
    const newCodes: string[] = [];
    for (let i = 0; i < generateCount; i++) {
      const randomPart = Math.random().toString(36).substring(2, 2 + generateLength - generatePrefix.length).toUpperCase();
      const code = `${generatePrefix}${randomPart}`;
      newCodes.push(code);
    }
    setCodes(newCodes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || codes.length === 0) {
      alert('Please provide a batch name and at least one promo code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/promocodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          codes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/promocodes/${data.batch.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('An error occurred while creating the batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/promocodes" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                ← Back to Promo Codes
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create Promo Code Batch</h1>
              <p className="mt-2 text-gray-600">
                Create a new batch of promo codes with bulk upload options
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Batch Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Batch Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Summer Sale 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Discount Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.discountType === 'percentage' ? '10' : '5.00'}
                  step={formData.discountType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discountType === 'percentage' ? 'Percentage (0-100)' : 'Amount in dollars'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Value
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  value={formData.minOrderValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Usage Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Usage Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Uses Per Code
                </label>
                <input
                  type="number"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From *
                </label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
              </div>
            </div>
          </div>

          {/* Promo Codes Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Promo Codes</h2>
            
            {/* Upload Method Selection */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('manual')}
                  className={`px-4 py-2 rounded-md ${
                    uploadMethod === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded-md ${
                    uploadMethod === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('generate')}
                  className={`px-4 py-2 rounded-md ${
                    uploadMethod === 'generate'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Auto Generate
                </button>
              </div>
            </div>

            {/* Manual Entry */}
            {uploadMethod === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Promo Codes (one per line)
                </label>
                <textarea
                  value={codes.join('\n')}
                  onChange={(e) => setCodes(e.target.value.split('\n').filter(code => code.trim()))}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PROMO123&#10;SUMMER2024&#10;SAVE20"
                />
              </div>
            )}

            {/* File Upload */}
            {uploadMethod === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV or Text File
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  File should contain one promo code per line
                </p>
                {codes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      Found {codes.length} codes in file
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Auto Generate */}
            {uploadMethod === 'generate' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Codes
                    </label>
                    <input
                      type="number"
                      value={generateCount}
                      onChange={(e) => setGenerateCount(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefix
                    </label>
                    <input
                      type="text"
                      value={generatePrefix}
                      onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PROMO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Length
                    </label>
                    <input
                      type="number"
                      value={generateLength}
                      onChange={(e) => setGenerateLength(parseInt(e.target.value) || 8)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="6"
                      max="20"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateCodes}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Generate {generateCount} Codes
                </button>
              </div>
            )}

            {/* Codes Preview */}
            {codes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Preview ({codes.length} codes)
                </h3>
                <div className="bg-gray-50 p-4 rounded-md max-h-32 overflow-y-auto">
                  <div className="text-sm text-gray-600">
                    {codes.slice(0, 10).join(', ')}
                    {codes.length > 10 && ` ... and ${codes.length - 10} more`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/promocodes"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || codes.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 