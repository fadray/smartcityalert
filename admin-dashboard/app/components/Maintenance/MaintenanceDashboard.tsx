'use client';

import { useState, useEffect } from 'react';
import { 
  WrenchIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../utils/api';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  priority: string;
  department: { name: string };
  reported_by: { full_name: string };
  assigned_to?: { full_name: string };
  created_at: string;
  scheduled_date?: string;
}

export default function MaintenanceDashboard({ token }: { token: string }) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, verified: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const api = apiClient(token);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        api.get('/api/maintenance/requests'),
        api.get('/api/maintenance/requests/stats'),
      ]);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const statsCards = [
    { name: 'Pending', value: stats.pending, icon: ClockIcon, color: 'yellow' },
    { name: 'In Progress', value: stats.inProgress, icon: WrenchIcon, color: 'blue' },
    { name: 'Completed', value: stats.completed, icon: CheckCircleIcon, color: 'green' },
    { name: 'Verified', value: stats.verified, icon: DocumentTextIcon, color: 'emerald' },
    { name: 'Overdue', value: stats.overdue, icon: ExclamationTriangleIcon, color: 'red' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading maintenance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Infrastructure Maintenance</h2>
          <p className="text-gray-500 mt-1">Track and manage maintenance requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statsCards.map((card) => (
          <div key={card.name} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.name}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                <card.icon className={`h-6 w-6 text-${card.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Maintenance Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{req.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{req.location}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{req.department?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">New Maintenance Request</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const api = apiClient(token);
                try {
                  await api.post('/api/maintenance/requests', {
                    title: (form.elements.namedItem('title') as HTMLInputElement).value,
                    description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
                    location: (form.elements.namedItem('location') as HTMLInputElement).value,
                    priority: (form.elements.namedItem('priority') as HTMLSelectElement).value,
                    department_id: (form.elements.namedItem('department_id') as HTMLSelectElement).value,
                  });
                  alert('Maintenance request created successfully');
                  setShowModal(false);
                  fetchData();
                } catch (error) {
                  alert('Failed to create request');
                }
              }}>
                <div className="space-y-4">
                  <input name="title" placeholder="Title" required className="w-full p-2 border rounded" />
                  <textarea name="description" placeholder="Description" rows={3} required className="w-full p-2 border rounded"></textarea>
                  <input name="location" placeholder="Location" required className="w-full p-2 border rounded" />
                  <select name="priority" className="w-full p-2 border rounded">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedRequest(null)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium mb-2">{selectedRequest.title}</h3>
              <div className="space-y-3 text-sm">
                <p><strong>Description:</strong> {selectedRequest.description}</p>
                <p><strong>Location:</strong> {selectedRequest.location}</p>
                <p><strong>Priority:</strong> {selectedRequest.priority}</p>
                <p><strong>Status:</strong> {selectedRequest.status}</p>
                <p><strong>Department:</strong> {selectedRequest.department?.name || '-'}</p>
                <p><strong>Reported By:</strong> {selectedRequest.reported_by?.full_name || '-'}</p>
                <p><strong>Reported On:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-gray-100 rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
