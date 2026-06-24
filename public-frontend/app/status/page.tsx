'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrackStatus() {
  const router = useRouter();
  const [incidentId, setIncidentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedId = incidentId.trim();
    if (!trimmedId) {
      setError('Please enter an incident ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Navigate to track page
    router.push(`/track/${trimmedId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">🔍 Track Your Incident</h1>
          <p className="text-blue-100 text-sm mt-1">Enter the incident ID you received to check its current status</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Incident ID *</label>
              <input
                type="text"
                value={incidentId}
                onChange={(e) => {
                  setIncidentId(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., abc1234f-5e6d-7c8b-9a0b-1c2d3e4f5g6h"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                required
              />
              <p className="mt-2 text-sm text-gray-500">Enter the full incident ID you received in your confirmation message</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Checking...' : '🔍 Track Incident'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>💡 Don't have an incident ID?</p>
            <Link href="/report" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">Report a new incident</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
