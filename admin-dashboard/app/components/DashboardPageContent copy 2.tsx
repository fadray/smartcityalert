'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Sidebar from './Layout/Sidebar';
import Header from './Layout/Header';
import StatsCards from './Layout/StatsCards';
import ChartsSection from './ChartsSection';
import DashboardContentTable from './DashboardContent';
import MaintenanceDashboard from './Maintenance/MaintenanceDashboard';
import ReportIncident from './ReportIncident';
import { apiClient } from '../utils/api';
import { Incident, Department, Stats, User } from '../types';

export default function DashboardPageContent() {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ active_incidents: 0, today_incidents: 0, pending_approvals: 0, by_department: [] });
  const [pendingApprovals, setPendingApprovals] = useState<Incident[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [additionalStats, setAdditionalStats] = useState({
    daysSinceLastIncident: 0,
    thisMonthIncidents: 0,
    thisMonthFrequency: '0',
    closedThisMonth: 0,
    dueIncidents: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [typeData, setTypeData] = useState([]);

  // Pagination and Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const fetchAllData = async () => {
    if (!token) return;
    setDataLoading(true);
    const api = apiClient(token);
    try {
      const incidentsRes = await api.get('/api/incidents');
      console.log('Fetched incidents:', incidentsRes.data);
      const incidentsData = incidentsRes.data;
      setIncidents(incidentsData);

      const deptsRes = await api.get('/api/departments');
      setDepartments(deptsRes.data);

      const statsRes = await api.get('/api/incidents/stats');
      setStats(statsRes.data);

      const usersRes = await api.get('/api/users');
      setUsers(usersRes.data);

      const pendingRes = await api.get('/api/incidents/pending-approvals');
      setPendingApprovals(pendingRes.data);

      if (incidentsData.length > 0) {
        calculateStats(incidentsData);
      }

      toast.success(`Loaded ${incidentsData.length} incidents`);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const calculateStats = (incidentsList: Incident[]) => {
    if (!incidentsList.length) return;

    const latestIncident = new Date(Math.max(...incidentsList.map(i => new Date(i.created_at).getTime())));
    const today = new Date();
    const daysSinceLast = Math.floor((today.getTime() - latestIncident.getTime()) / (1000 * 60 * 60 * 24));

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthIncidents = incidentsList.filter(i => {
      const d = new Date(i.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const closedThisMonth = thisMonthIncidents.filter(i => i.status === 'closed' || i.status === 'resolved');
    const frequency = incidentsList.length > 0 ? ((thisMonthIncidents.length / incidentsList.length) * 100).toFixed(1) : '0';
    const dueIncidents = incidentsList.filter(i => {
      const daysOld = (today.getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 7 && i.status !== 'closed' && i.status !== 'resolved';
    });

    setAdditionalStats({
      daysSinceLastIncident: daysSinceLast,
      thisMonthIncidents: thisMonthIncidents.length,
      thisMonthFrequency: frequency,
      closedThisMonth: closedThisMonth.length,
      dueIncidents: dueIncidents.length,
    });

    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthIncidents = incidentsList.filter(inc => {
        const incDate = new Date(inc.created_at);
        return incDate.getMonth() === date.getMonth() && incDate.getFullYear() === date.getFullYear();
      });
      const monthResolved = monthIncidents.filter(inc => inc.status === 'closed' || inc.status === 'resolved');
      monthly.push({
        month: monthName,
        incidents: monthIncidents.length,
        resolved: monthResolved.length,
      });
    }
    setMonthlyData(monthly);

    const severityMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    incidentsList.forEach(i => severityMap[i.severity_level as keyof typeof severityMap]++);
    const severityChart = Object.entries(severityMap).map(([level, count]) => ({
      name: `Level ${level}`,
      value: count,
      color: level === '1' ? '#10B981' : level === '2' ? '#3B82F6' : level === '3' ? '#F59E0B' : level === '4' ? '#F97316' : '#EF4444',
    })).filter(d => d.value > 0);
    setSeverityData(severityChart);

    const typeMap: Record<string, number> = {};
    incidentsList.forEach(i => typeMap[i.incident_type] = (typeMap[i.incident_type] || 0) + 1);
    const typeChart = Object.entries(typeMap).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: type === 'medical' ? '#10B981' : type === 'fire' ? '#EF4444' : type === 'security' ? '#F59E0B' : '#3B82F6',
    }));
    setTypeData(typeChart);
  };

  const refreshData = () => {
    if (token) {
      fetchAllData();
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'overall_director' || user?.role === 'overall_manager';

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    if (filters.type && incident.incident_type !== filters.type) return false;
    if (filters.severity && incident.severity_level !== parseInt(filters.severity)) return false;
    if (filters.status && incident.status !== filters.status) return false;
    if (filters.startDate) {
      const incidentDate = new Date(incident.created_at);
      const startDate = new Date(filters.startDate);
      if (incidentDate < startDate) return false;
    }
    if (filters.endDate) {
      const incidentDate = new Date(incident.created_at);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      if (incidentDate > endDate) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      severity: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={user?.role || 'resident'}
        pendingCount={pendingApprovals.length}
      />
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} user={user} onLogout={handleLogout} />
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <StatsCards stats={stats} additionalStats={additionalStats} />
                {monthlyData.length > 0 && (
                  <ChartsSection 
                    monthlyData={monthlyData} 
                    severityData={severityData}
                    typeData={typeData}
                  />
                )}
                <DashboardContentTable incidents={incidents} onViewIncident={handleViewIncident} />
              </div>
            )}
            
            {activeTab === 'maintenance' && isAdmin && (
              <MaintenanceDashboard token={token} />
            )}
            
            {activeTab === 'incidents' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Incidents ({filteredIncidents.length})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-1"
                    >
                      🔍 Filters
                      {(filters.type || filters.severity || filters.status || filters.startDate || filters.endDate) && (
                        <span className="bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">●</span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('report')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      + Report New Incident
                    </button>
                  </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Incident Type</label>
                        <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          <option value="medical">🚑 Medical</option>
                          <option value="fire">🔥 Fire</option>
                          <option value="security">👮 Security</option>
                          <option value="maintenance">🔧 Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                        <select
                          value={filters.severity}
                          onChange={(e) => handleFilterChange('severity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Levels</option>
                          <option value="1">🟢 Level 1 - Low</option>
                          <option value="2">🔵 Level 2 - Medium</option>
                          <option value="3">🟡 Level 3 - High</option>
                          <option value="4">🟠 Level 4 - Critical</option>
                          <option value="5">🔴 Level 5 - Catastrophic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="pending">⏳ Pending</option>
                          <option value="acknowledged">👀 Acknowledged</option>
                          <option value="assigned">📋 Assigned</option>
                          <option value="in_progress">🔨 In Progress</option>
                          <option value="pending_approval">✅ Pending Approval</option>
                          <option value="resolved">✔️ Resolved</option>
                          <option value="closed">🔒 Closed</option>
                          <option value="escalated">⚠️ Escalated</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Incidents Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paginatedIncidents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            No incidents found. Click &quot;Report New Incident&quot; to create one.
                          </td>
                        </tr>
                      ) : (
                        paginatedIncidents.map((incident) => (
                          <tr key={incident.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500">{incident.id?.slice(0, 8) || 'N/A'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{incident.title || 'Untitled'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{incident.incident_type || 'N/A'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                incident.severity_level >= 4 ? 'bg-red-100 text-red-800' :
                                incident.severity_level >= 3 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                Level {incident.severity_level || 1}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                                {incident.status?.replace('_', ' ') || 'Unknown'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {incident.created_at ? new Date(incident.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <button onClick={() => handleViewIncident(incident)} className="text-blue-600 hover:text-blue-900 font-medium">
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length} incidents
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending-approvals' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals ({pendingApprovals.length})</h2>
                {pendingApprovals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending approvals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((incident) => (
                      <div key={incident.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                        <button onClick={() => handleViewIncident(incident)} className="mt-3 text-blue-600 hover:text-blue-900 text-sm font-medium">
                          Review & Approve →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && (
              <ReportIncident token={token} onSuccess={refreshData} />
            )}

            {activeTab === 'users' && isAdmin && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    + Add User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{userItem.full_name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userItem.phone}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                              {userItem.role}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userItem.department?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'departments' && isAdmin && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    + Add Department
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="border rounded-lg p-4 hover:shadow-md transition" style={{ borderTopColor: dept.color, borderTopWidth: '4px' }}>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{dept.code}</p>
                      <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports & Analytics</h2>
                <p className="text-gray-500">Reports dashboard coming soon...</p>
              </div>
            )}

            {activeTab === 'workflow' && isAdmin && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Configuration</h2>
                <p className="text-gray-500">Workflow editor coming soon...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Incident Detail Modal */}
      {showDetailModal && selectedIncident && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedIncident.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{selectedIncident.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="font-medium">Type:</span> {selectedIncident.incident_type}</div>
                <div><span className="font-medium">Severity:</span> Level {selectedIncident.severity_level}</div>
                <div><span className="font-medium">Status:</span> {selectedIncident.status}</div>
                <div><span className="font-medium">Workflow:</span> Level {selectedIncident.current_workflow_level}/6</div>
                <div className="col-span-2"><span className="font-medium">Reported:</span> {new Date(selectedIncident.created_at).toLocaleString()}</div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
