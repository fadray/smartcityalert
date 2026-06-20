'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrackStatus() {
  const router = useRouter();
  const [incidentId, setIncidentId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId.trim()) {
      alert('Please enter an incident ID');
      return;
    }
    router.push(`/track/${incidentId.trim()}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Track Your Incident</h1>
        <p className="text-gray-600 mb-6">Enter the incident ID you received to check its current status</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incident ID *</label>
            <input
              type="text"
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              placeholder="e.g., abc1234f-5e6d-7c8b-9a0b-1c2d3e4f5g6h"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Enter the full incident ID you received in your confirmation message</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Checking...' : '🔍 Track Incident'}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>💡 Don't have an incident ID? </p>
          <Link href="/report" className="text-blue-600 hover:underline">Report a new incident</Link>
        </div>
      </div>
    </div>
  )
}
