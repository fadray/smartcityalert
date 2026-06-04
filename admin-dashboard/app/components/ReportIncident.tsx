'use client';

import { useState, useEffect, Fragment } from 'react';
import { apiClient } from '../utils/api';
import { Department } from '../types';
import { 
  PhotoIcon, 
  XMarkIcon, 
  DocumentTextIcon, 
  MapPinIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

interface ReportIncidentProps {
  token: string;
  onSuccess?: () => void;
}

export default function ReportIncident({ token, onSuccess }: ReportIncidentProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'medical',
    department_id: '',
    severity_level: '3',
    location: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const api = apiClient(token);
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, department_id: res.data[0].id }));
      }
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      setError('Failed to load departments. Please refresh the page.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const api = apiClient(token);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/api/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadedImages(prev => [...prev, res.data.url]);
      } catch (error) {
        console.error('Upload failed:', error);
        setError('Failed to upload image. Please try again.');
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.department_id) {
      setError('Please select a department');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    return true;
  };

  const getSeverityLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: 'Low - Minor issue',
      2: 'Medium - Moderate concern',
      3: 'High - Serious incident',
      4: 'Critical - Immediate attention',
      5: 'Catastrophic - Emergency',
    };
    return labels[level] || 'Unknown';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      medical: '🚑',
      fire: '🔥',
      security: '👮',
      maintenance: '🔧',
    };
    return icons[type] || '📌';
  };

  const getSeverityColor = (level: number) => {
    if (level >= 4) return 'bg-red-100 text-red-700';
    if (level >= 3) return 'bg-orange-100 text-orange-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;

    setLoading(true);
    const api = apiClient(token);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        incident_type: formData.incident_type,
        department_id: formData.department_id,
        severity_level: parseInt(formData.severity_level),
        location: formData.location,
        latitude: 0,
        longitude: 0,
        images: uploadedImages || [],
      };
      
      const res = await api.post('/api/incidents', payload);
      console.log('Incident created:', res.data);
      
      // Get department name
      const department = departments.find(d => d.id === formData.department_id);
      
      // Store submitted data for modal
      setSubmittedData({
        id: res.data.id,
        title: formData.title,
        description: formData.description,
        incident_type: formData.incident_type,
        severity_level: parseInt(formData.severity_level),
        department_name: department?.name || 'Unknown',
        location: formData.location,
        created_at: new Date().toISOString(),
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        incident_type: 'medical',
        department_id: departments[0]?.id || '',
        severity_level: '3',
        location: '',
      });
      setUploadedImages([]);
      
      // Show modal - DO NOT call onSuccess here
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Failed to report incident:', error);
      setError(error.response?.data?.message || error.message || 'Failed to report incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setSubmittedData(null);
    // Only refresh data when modal is closed
    if (onSuccess) {
      onSuccess();
    }
  };

  const viewIncidents = () => {
    setShowSuccessModal(false);
    setSubmittedData(null);
    // Refresh data first
    if (onSuccess) {
      onSuccess();
    }
    // Then navigate
    setTimeout(() => {
      window.location.href = '/dashboard?tab=incidents';
    }, 100);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Report New Incident</h2>
            <p className="text-blue-100 text-sm mt-1">Fill out the form below to report an incident</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Incident Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., Power Outage in Building A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Provide detailed information about the incident..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.incident_type}
                  onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="medical">🚑 Medical Emergency</option>
                  <option value="fire">🔥 Fire Outbreak</option>
                  <option value="security">👮 Security Threat</option>
                  <option value="maintenance">🔧 Infrastructure Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.severity_level}
                  onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="1">🟢 Level 1 - Low</option>
                  <option value="2">🔵 Level 2 - Medium</option>
                  <option value="3">🟡 Level 3 - High</option>
                  <option value="4">🟠 Level 4 - Critical</option>
                  <option value="5">🔴 Level 5 - Catastrophic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="e.g., Building A, Floor 3, Room 305"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Upload Images (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition">
                <div className="space-y-1 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload photos</span>
                      <input type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={`http://localhost:3001${img}`} alt={`Upload ${index}`} className="h-24 w-full object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    incident_type: 'medical',
                    department_id: departments[0]?.id || '',
                    severity_level: '3',
                    location: '',
                  });
                  setUploadedImages([]);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal - Manual close only */}
      <Transition appear show={showSuccessModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}} static>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-center mb-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 text-center">
                    Incident Reported Successfully!
                  </Dialog.Title>
                  
                  {submittedData && (
                    <div className="mt-4">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-sm font-medium text-gray-500">Incident ID:</span>
                          <span className="text-sm font-mono text-gray-900">{submittedData.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Title:</span>
                          <span className="text-sm text-gray-900 font-medium">{submittedData.title}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Type:</span>
                          <span className="text-sm text-gray-900">
                            {getTypeIcon(submittedData.incident_type)} {submittedData.incident_type}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Severity:</span>
                          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getSeverityColor(submittedData.severity_level)}`}>
                            Level {submittedData.severity_level}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Department:</span>
                          <span className="text-sm text-gray-900">{submittedData.department_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <span className="text-sm text-gray-900">{submittedData.location}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          📋 A responder has been notified. You can track this incident in the Incidents tab.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition"
                      onClick={viewIncidents}
                    >
                      View All Incidents
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
