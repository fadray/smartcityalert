'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Incident {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  severity_level: number;
  status: string;
  created_at: string;
  images?: string[];
  department?: { id: string; name: string };
}

export default function TrackIncident() {
  const params = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${IMAGE_BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/public/incidents/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Incident not found. Please check the ID.');
          } else {
            setError('Failed to load incident details.');
          }
          return;
        }

        const data = await response.json();
        if (data.success && data.incident) {
          setIncident(data.incident);
        } else {
          setError('Invalid response from server');
        }
      } catch (error) {
        console.error('Error fetching incident:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchIncident();
    }
  }, [params.id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      acknowledged: 'bg-blue-100 text-blue-800 border-blue-200',
      assigned: 'bg-purple-100 text-purple-800 border-purple-200',
      in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      escalated: 'bg-red-100 text-red-800 border-red-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: '⏳',
      acknowledged: '👀',
      assigned: '👮',
      in_progress: '🚀',
      resolved: '✅',
      escalated: '⚠️',
      closed: '🔒',
    };
    return icons[status] || '📌';
  };

  const getSeverityEmoji = (level: number) => {
    if (level >= 4) return '🔴';
    if (level >= 3) return '🟡';
    return '🟢';
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Incident Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/report" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition">Report New Incident</Link>
          <Link href="/status" className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-300 transition">Track Another</Link>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  let imageUrls: string[] = [];
  if (incident.images) {
    try {
      if (typeof incident.images === 'string') {
        const parsed = JSON.parse(incident.images);
        imageUrls = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(incident.images)) {
        imageUrls = incident.images;
      }
    } catch (e) {
      console.warn('Could not parse images:', e);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">📊 Incident Status</h1>
            <span className={`px-4 py-1.5 rounded-xl text-sm font-medium border ${getStatusColor(incident.status)}`}>
              {getStatusIcon(incident.status)} {incident.status.toUpperCase()}
            </span>
          </div>
          <p className="text-blue-100 text-sm mt-1">ID: {incident.id}</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Title</h2>
            <p className="text-lg font-semibold text-gray-900 mt-1">{incident.title}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">Description</h2>
            <p className="text-gray-700 mt-1 leading-relaxed">{incident.description}</p>
          </div>
          
          {imageUrls.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">Uploaded Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {imageUrls.map((image, index) => {
                  const imageUrl = getImageUrl(image);
                  const hasError = imageErrors.has(index);
                  
                  if (hasError) {
                    return (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Image not available</span>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group cursor-pointer hover:shadow-lg transition-shadow">
                      <Image
                        src={imageUrl}
                        alt={`Incident image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={true}
                        onError={() => handleImageError(index)}
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {imageUrls.length === 0 && (
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-500">
              <p>📸 No images uploaded for this incident</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Type</h2>
              <p className="text-gray-900 capitalize mt-1 font-medium">{incident.incident_type}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Severity</h2>
              <p className="text-gray-900 mt-1 font-medium">
                {getSeverityEmoji(incident.severity_level)} Level {incident.severity_level}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Department</h2>
              <p className="text-gray-900 mt-1 font-medium">{incident.department?.name || 'Not assigned yet'}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Reported</h2>
              <p className="text-gray-900 mt-1 font-medium">{new Date(incident.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span>📱</span>
              <span>You will receive updates about this incident via WhatsApp or SMS</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/report" className="text-center bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium">📢 Report Another Incident</Link>
            <Link href="/status" className="text-center bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium">🔍 Track Another Incident</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
