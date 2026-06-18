'use client';

import { useState, useEffect } from 'react';
import { Incident } from '../../types';
import { apiClient } from '../../utils/api';
import { 
  XMarkIcon, 
  UserCircleIcon, 
  CalendarIcon, 
  MapPinIcon,
  ArrowPathIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Assignee {
  id: string;
  name: string;
  role: string;
  type: 'user' | 'responder';
  badge?: string;
  department_id?: string;
}

interface UpdateTrailItem {
  id: string;
  type: 'status' | 'assignment' | 'approval' | 'escalation' | 'resolution' | 'creation';
  action: string;
  user: string;
  userRole: string;
  timestamp: Date;
  details: string;
}

interface IncidentDetailModalProps {
  incident: Incident;
  token: string;
  onClose: () => void;
  onRefresh: () => void;
  currentUserRole: string;
  currentUserId: string;
}

export default function IncidentDetailModal({ 
  incident, 
  token, 
  onClose, 
  onRefresh, 
  currentUserRole,
  currentUserId 
}: IncidentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(incident.status);
  const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedAssigneeType, setSelectedAssigneeType] = useState<string>('user');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [comment, setComment] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<Incident>(incident);
  const [updateTrail, setUpdateTrail] = useState<UpdateTrailItem[]>([]);

  useEffect(() => {
    if (incident) {
      setCurrentIncident(incident);
      setSelectedStatus(incident.status);
      fetchAvailableAssignees();
      generateCompleteUpdateTrail(incident);
    }
  }, [incident]);

  const generateCompleteUpdateTrail = async (inc: Incident) => {
    const trail: UpdateTrailItem[] = [];
    
    trail.push({
      id: 'creation',
      type: 'creation',
      action: 'Incident Created',
      user: inc.reported_by?.full_name || 'Unknown',
      userRole: inc.reported_by?.role || 'N/A',
      timestamp: new Date(inc.created_at),
      details: `Incident reported: ${inc.title}`,
    });
    
    if (inc.escalation_history) {
      try {
        let history = inc.escalation_history;
        if (typeof history === 'string') {
          history = JSON.parse(history);
        }
        if (Array.isArray(history)) {
          history.forEach((event: any, idx: number) => {
            let action = '';
            let type: any = 'escalation';
            
            if (event.action === 'status_change') {
              action = `Status changed from ${event.old_value} to ${event.new_value}`;
              type = 'status';
            } else if (event.action === 'assignment') {
              action = `Assigned to ${event.assignee_name || 'someone'}`;
              type = 'assignment';
            } else if (event.action === 'workflow_change') {
              action = `Workflow level changed from ${event.old_value} to ${event.new_value}`;
              type = 'escalation';
            } else if (event.action === 'resolution_proof') {
              action = `Resolution proof submitted`;
              type = 'resolution';
            } else if (event.action === 'approval') {
              action = `Resolution approved`;
              type = 'approval';
            } else {
              action = event.reason || `Event occurred`;
            }
            
            trail.push({
              id: `history-${idx}`,
              type: type,
              action: action,
              user: event.user_name || 'System',
              userRole: event.user_role || 'System',
              timestamp: new Date(event.timestamp),
              details: event.comments || event.reason || '',
            });
          });
        }
      } catch (e) {}
    }
    
    trail.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setUpdateTrail(trail);
  };

  const fetchAvailableAssignees = async () => {
    setLoadingAssignees(true);
    const api = apiClient(token);
    try {
      const usersRes = await api.get('/api/users');
      let filteredUsers = usersRes.data.filter((u: any) => 
        u.id !== currentIncident.reported_by?.id && 
        u.is_active !== false
      );
      
      if (currentIncident.department_id) {
        filteredUsers = filteredUsers.filter((u: any) => u.department_id === currentIncident.department_id);
      }
      
      const mappedUsers = filteredUsers.map((u: any) => ({
        id: u.id,
        name: u.full_name,
        role: u.role,
        type: 'user' as const,
        department_id: u.department_id
      }));
      
      const respondersRes = await api.get('/api/responders');
      let filteredResponders = respondersRes.data.filter((r: any) => 
        r.user?.id !== currentIncident.reported_by?.id
      );
      
      if (currentIncident.department_id) {
        filteredResponders = filteredResponders.filter((r: any) => r.department_id === currentIncident.department_id);
      }
      
      const mappedResponders = filteredResponders.map((r: any) => ({
        id: r.id,
        name: r.user?.full_name || 'Unknown',
        role: r.user?.role || 'responder',
        type: 'responder' as const,
        badge: r.badge_number,
        department_id: r.department_id
      }));
      
      setAvailableAssignees([...mappedUsers, ...mappedResponders]);
    } catch (error) {
      console.error('Failed to fetch assignees:', error);
    } finally {
      setLoadingAssignees(false);
    }
  };

  const refreshIncidentData = async () => {
    const api = apiClient(token);
    try {
      const response = await api.get(`/api/incidents/${currentIncident.id}`);
      if (response.data) {
        setCurrentIncident(response.data);
        generateCompleteUpdateTrail(response.data);
        setSelectedStatus(response.data.status);
      }
    } catch (error) {
      console.error('Failed to refresh incident:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    const api = apiClient(token);
    try {
      await api.put(`/api/incidents/${currentIncident.id}/status`, { status: newStatus });
      alert(`Incident status updated to ${newStatus}`);
      await refreshIncidentData();
      onRefresh();
      // Close modal after successful update
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee) {
      alert('Please select a person to assign');
      return;
    }
    setAssignLoading(true);
    const api = apiClient(token);
    try {
      await api.post(`/api/incidents/${currentIncident.id}/assign`, { 
        assigneeId: selectedAssignee,
        assigneeType: selectedAssigneeType,
        comments: comment 
      });
      
      alert('Incident assigned successfully');
      setShowAssignModal(false);
      setSelectedAssignee('');
      setComment('');
      await refreshIncidentData();
      onRefresh();
      fetchAvailableAssignees();
      // Close modal after successful assignment
      onClose();
    } catch (error: any) {
      console.error('Failed to assign:', error);
      alert(error.response?.data?.message || 'Failed to assign. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusOptions = () => {
    const options = [
      { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-100 text-blue-800' },
      { value: 'assigned', label: 'Assigned', color: 'bg-indigo-100 text-indigo-800' },
      { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
      { value: 'pending_approval', label: 'Pending Approval', color: 'bg-orange-100 text-orange-800' },
      { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
      { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
      { value: 'escalated', label: 'Escalated', color: 'bg-red-100 text-red-800' },
    ];
    
    if (currentUserRole === 'responder') {
      return options.filter(opt => ['pending', 'acknowledged', 'in_progress', 'resolved'].includes(opt.value));
    }
    if (currentUserRole === 'supervisor') {
      return options.filter(opt => ['assigned', 'in_progress', 'pending_approval'].includes(opt.value));
    }
    if (currentUserRole === 'hod' || currentUserRole === 'dept_director') {
      return options.filter(opt => ['pending_approval', 'resolved', 'closed'].includes(opt.value));
    }
    return options;
  };

  const canAssign = () => {
    return ['supervisor', 'hod', 'dept_director', 'overall_manager', 'overall_director', 'admin'].includes(currentUserRole);
  };

  const getSeverityColor = (level: number) => {
    if (level >= 4) return 'bg-red-100 text-red-800';
    if (level >= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getAssignedToName = () => {
    if (currentIncident.assigned_to?.user?.full_name) {
      return currentIncident.assigned_to.user.full_name;
    }
    if (currentIncident.assigned_to_id) {
      const assignee = availableAssignees.find(a => a.id === currentIncident.assigned_to_id);
      if (assignee) return assignee.name;
    }
    return 'Unassigned';
  };

  const getTrailIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'status':
        return <ArrowPathIcon className="h-4 w-4 text-blue-500" />;
      case 'assignment':
        return <UserPlusIcon className="h-4 w-4 text-green-500" />;
      case 'approval':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'escalation':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'resolution':
        return <CheckCircleIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const statusOptions = getStatusOptions();

  const getImages = () => {
    if (!currentIncident.images) return [];
    if (Array.isArray(currentIncident.images)) return currentIncident.images;
    if (typeof currentIncident.images === 'string') {
      try {
        const parsed = JSON.parse(currentIncident.images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const images = getImages();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Incident Details</h3>
              <p className="text-sm text-gray-500 mt-1">ID: {currentIncident.id.slice(0, 8)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Title and Status */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentIncident.title}</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(currentIncident.severity_level)}`}>
                    Severity Level {currentIncident.severity_level}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {currentIncident.incident_type}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleStatusUpdate(selectedStatus)}
                  disabled={loading || selectedStatus === currentIncident.status}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  Update Status
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600">{currentIncident.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Reported By:</span>
                  <span className="text-gray-600">{currentIncident.reported_by?.full_name || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">({currentIncident.reported_by?.role || 'N/A'})</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Reported On:</span>
                  <span className="text-gray-600">{new Date(currentIncident.created_at).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="text-gray-600">{currentIncident.location || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Department:</span>
                  <span className="text-gray-600">{currentIncident.department?.name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <UserPlusIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Assigned To:</span>
                  <span className="text-gray-600 font-semibold text-blue-600">{getAssignedToName()}</span>
                  {canAssign() && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                    >
                      (Reassign)
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <ArrowPathIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Workflow Level:</span>
                  <span className="text-gray-600">Level {currentIncident.current_workflow_level}/6</span>
                </div>
              </div>
            </div>

            {/* Images Section */}
            {images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`http://localhost:3001${img}`}
                      alt={`Incident ${idx}`}
                      className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(`http://localhost:3001${img}`, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Update Trail */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Update Trail ({updateTrail.length} events)
              </h4>
              <div className="flow-root">
                <ul className="-mb-8">
                  {updateTrail.length === 0 ? (
                    <li className="text-center py-4 text-gray-500">No updates yet</li>
                  ) : (
                    updateTrail.map((item, idx) => (
                      <li key={`${item.id}-${idx}`}>
                        <div className="relative pb-8">
                          {idx !== updateTrail.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                {getTrailIcon(item.type)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {item.action}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                by <span className="font-medium">{item.user}</span> ({item.userRole})
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{item.details}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAssignModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Incident</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Person</label>
                  {loadingAssignees ? (
                    <div className="text-center py-4 text-gray-500">Loading available people...</div>
                  ) : availableAssignees.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No available people in this department to assign.
                    </div>
                  ) : (
                    <select
                      value={selectedAssignee ? `${selectedAssignee}|${selectedAssigneeType}` : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [id, type] = e.target.value.split('|');
                          setSelectedAssignee(id);
                          setSelectedAssigneeType(type);
                        } else {
                          setSelectedAssignee('');
                          setSelectedAssigneeType('user');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a person...</option>
                      {availableAssignees.some(a => a.type === 'user') && (
                        <optgroup label="👔 Users">
                          {availableAssignees.filter(a => a.type === 'user').map(assignee => (
                            <option key={`user|${assignee.id}`} value={`${assignee.id}|user`}>
                              {assignee.name} ({assignee.role})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {availableAssignees.some(a => a.type === 'responder') && (
                        <optgroup label="🛡️ Responders">
                          {availableAssignees.filter(a => a.type === 'responder').map(assignee => (
                            <option key={`responder|${assignee.id}`} value={`${assignee.id}|responder`}>
                              {assignee.name} ({assignee.role}) {assignee.badge && `- Badge: ${assignee.badge}`}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add instructions or comments..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={assignLoading || !selectedAssignee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
