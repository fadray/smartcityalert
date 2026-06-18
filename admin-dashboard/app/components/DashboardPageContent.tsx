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
import IncidentDetailModal from './Incidents/IncidentDetailModal';
import MaintenanceDashboard from './Maintenance/MaintenanceDashboard';
import UserManagement from './Users/UserManagement';
import ReportIncident from './ReportIncident';
import DepartmentsPage from './DepartmentsPage';
import ReportsDashboard from './Reports/ReportsDashboard';
import WorkflowConfig from './Workflow/WorkflowConfig';
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
  //const [monthlyData, setMonthlyData] = useState([]);
  //const [severityData, setSeverityData] = useState([]);
  //const [typeData, setTypeData] = useState([]);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; incidents: number; resolved: number }[]
  >([]);

  const [severityData, setSeverityData] = useState<
    { name: string; value: number; color: string }[]
  >([]);

  const [typeData, setTypeData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
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
      setIncidents(incidentsRes.data);
      const deptsRes = await api.get('/api/departments');
      setDepartments(deptsRes.data);
      const statsRes = await api.get('/api/incidents/stats');
      setStats(statsRes.data);
      const usersRes = await api.get('/api/users');
      setUsers(usersRes.data);
      const pendingRes = await api.get('/api/incidents/pending-approvals');
      setPendingApprovals(pendingRes.data);
      if (incidentsRes.data.length > 0) {
        calculateStats(incidentsRes.data);
      }
      toast.success(`Loaded ${incidentsRes.data.length} incidents`);
    } catch (error) {
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
    router.push('/login');
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'overall_director' || user?.role === 'overall_manager';

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

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              <>
                <StatsCards stats={stats} additionalStats={additionalStats} />
                {monthlyData.length > 0 && (
                  <ChartsSection monthlyData={monthlyData} severityData={severityData} typeData={typeData} />
                )}
                <DashboardContentTable incidents={incidents} onViewIncident={handleViewIncident} />
              </>
            )}
            {activeTab === 'maintenance' && isAdmin && <MaintenanceDashboard token={token} />}
            {activeTab === 'users' && isAdmin && <UserManagement token={token} onRefresh={refreshData} />}
            {activeTab === 'departments' && isAdmin && <DepartmentsPage />}
            {activeTab === 'reports' && <ReportsDashboard token={token} />}
            {activeTab === 'workflow' && isAdmin && <WorkflowConfig token={token} />}
            {activeTab === 'incidents' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">All Incidents ({filteredIncidents.length})</h2>
                  <button onClick={() => setActiveTab('report')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Report New Incident</button>
                </div>
                <div className="overflow-x-auto">
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

                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded">Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded">Next</button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'pending-approvals' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Pending Approvals ({pendingApprovals.length})</h2>
                {pendingApprovals.map((inc) => (
                  <div key={inc.id} className="border border-orange-200 rounded-lg p-4 mb-2 bg-orange-50">
                    <h3 className="font-semibold">{inc.title}</h3>
                    <p className="text-sm">{inc.description}</p>
                    <button onClick={() => handleViewIncident(inc)} className="mt-2 text-blue-600">Review</button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'report' && <ReportIncident token={token} onSuccess={refreshData} />}
          </div>
        </main>
      </div>
      {showDetailModal && selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          token={token}
          onClose={() => setShowDetailModal(false)}
          onRefresh={refreshData}
          currentUserRole={user?.role || 'resident'}
          currentUserId={user?.id || ''}
        />
      )}
    </div>
  );
}
