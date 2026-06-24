'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ReportIncident() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'general',
    severity_level: 1,
    location: '',
    phone: '',
    email: '',
    name: '',
  });

  const incidentTypes = [
    { value: 'fire', label: '🔥 Fire Emergency', severity: 5, color: 'bg-red-50 border-red-200 text-red-700' },
    { value: 'medical', label: '🚑 Medical Emergency', severity: 5, color: 'bg-green-50 border-green-200 text-green-700' },
    { value: 'security', label: '👮 Security Incident', severity: 4, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { value: 'infrastructure', label: '🔧 Infrastructure Issue', severity: 2, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { value: 'traffic', label: '🚦 Traffic Incident', severity: 3, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { value: 'flooding', label: '🌊 Flooding', severity: 4, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
    { value: 'general', label: '📋 General Report', severity: 1, color: 'bg-gray-50 border-gray-200 text-gray-700' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const limitedFiles = files.slice(0, 5);
      setSelectedFiles(limitedFiles);
      const urls = limitedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, String(value));
      });
      selectedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await fetch(`${apiUrl}/public/incidents`, {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      
      if (data.success && data.id) {
        router.push(`/track/${data.id}`);
      } else {
        throw new Error(data.message || 'No incident ID returned');
      }
    } catch (error: any) {
      console.error('❌ Error reporting incident:', error);
      setError(error.message || 'Error submitting report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">📢 Report an Incident</h1>
          <p className="text-blue-100 text-sm mt-1">Fill in the details below to report an incident in The Redemption City.</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <span className="text-lg">❌</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Incident Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Incident Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {incidentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        incident_type: type.value, 
                        severity_level: type.severity 
                      });
                    }}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      formData.incident_type === type.value
                        ? `${type.color} border-2 shadow-md scale-[1.02]`
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Brief title of the incident"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Describe the incident in detail..."
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Where did this happen? (e.g., Campground Zone B)"
              />
            </div>

            {/* Name and Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+234-XXX-XXX-XXXX"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Images (Optional)
              </label>
              <div 
                className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-all cursor-pointer bg-gray-50 hover:bg-gray-100"
                onClick={triggerFileUpload}
              >
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB each (Max 5 images)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selected Images ({previewUrls.length}/5)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                '🚀 Report Incident'
              )}
            </button>
          </form>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>📱 Reports are sent to the appropriate department for swift action.</p>
            <p className="mt-1">For emergencies, call: <span className="font-semibold text-gray-700">+234-800-SMART-CITY</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
