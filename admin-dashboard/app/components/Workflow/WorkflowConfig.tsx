'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../utils/api';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EscalationLevel {
  level: number;
  role: string;
  timeout_minutes: number;
  next_role: string;
  notification_enabled: boolean;
}

interface WorkflowConfig {
  id: string;
  name: string;
  is_active: boolean;
  acknowledgment_rules: {
    roles: string[];
    auto_acknowledge: boolean;
    timeout_minutes: number;
  };
  assignment_rules: {
    auto_assign: boolean;
    assignment_type: string;
    timeout_minutes: number;
  };
  escalation_levels: EscalationLevel[];
  closure_rules: {
    required_roles: string[];
    require_approval: boolean;
    approval_roles: string[];
  };
}

const ROLE_OPTIONS = [
  { value: 'responder', label: 'Responder/Staff' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'dept_director', label: 'Department Director' },
  { value: 'overall_manager', label: 'Overall Manager' },
  { value: 'overall_director', label: 'Overall Director' },
  { value: 'admin', label: 'Admin' },
];

export default function WorkflowConfig({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [newLevel, setNewLevel] = useState<EscalationLevel>({
    level: 7,
    role: 'admin',
    timeout_minutes: 360,
    next_role: 'admin',
    notification_enabled: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const api = apiClient(token);
    try {
      const res = await api.get('/api/workflow/config');
      setConfig(res.data);
    } catch (error) {
      console.error('Failed to fetch workflow config:', error);
      toast.error('Failed to load workflow configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updatedConfig: WorkflowConfig) => {
    const api = apiClient(token);
    try {
      await api.put(`/api/workflow/config/${updatedConfig.id}`, updatedConfig);
      toast.success('Workflow configuration updated');
      fetchConfig();
    } catch (error) {
      console.error('Failed to update config:', error);
      toast.error('Failed to update workflow configuration');
    }
  };

  const handleAcknowledgmentUpdate = async (updates: any) => {
    if (!config) return;
    const updated = {
      ...config,
      acknowledgment_rules: { ...config.acknowledgment_rules, ...updates },
    };
    await updateConfig(updated);
  };

  const handleAssignmentUpdate = async (updates: any) => {
    if (!config) return;
    const updated = {
      ...config,
      assignment_rules: { ...config.assignment_rules, ...updates },
    };
    await updateConfig(updated);
  };

  const handleClosureUpdate = async (updates: any) => {
    if (!config) return;
    const updated = {
      ...config,
      closure_rules: { ...config.closure_rules, ...updates },
    };
    await updateConfig(updated);
  };

  const handleEscalationUpdate = async (level: number, updates: any) => {
    if (!config) return;
    const updatedLevels = config.escalation_levels.map(l =>
      l.level === level ? { ...l, ...updates } : l
    );
    const updated = { ...config, escalation_levels: updatedLevels };
    await updateConfig(updated);
    setEditingLevel(null);
  };

  const addEscalationLevel = async () => {
    if (!config) return;
    const updatedLevels = [...config.escalation_levels, newLevel];
    updatedLevels.sort((a, b) => a.level - b.level);
    const updated = { ...config, escalation_levels: updatedLevels };
    await updateConfig(updated);
    setShowAddLevel(false);
    setNewLevel({
      level: updatedLevels.length + 1,
      role: 'admin',
      timeout_minutes: 360,
      next_role: 'admin',
      notification_enabled: true,
    });
  };

  const removeEscalationLevel = async (level: number) => {
    if (!config) return;
    const updatedLevels = config.escalation_levels.filter(l => l.level !== level);
    const updated = { ...config, escalation_levels: updatedLevels };
    await updateConfig(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No workflow configuration found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflow Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Configure escalation rules, acknowledgment, assignment, and closure settings</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {config.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Acknowledgment Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">📋 Acknowledgment Rules</h3>
          <p className="text-sm text-gray-500">Who can acknowledge incidents and auto-acknowledgment settings</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Who can acknowledge?</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(role => (
                  <label key={role.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={config.acknowledgment_rules.roles.includes(role.value)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...config.acknowledgment_rules.roles, role.value]
                          : config.acknowledgment_rules.roles.filter(r => r !== role.value);
                        handleAcknowledgmentUpdate({ roles: newRoles });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto Acknowledgment</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={config.acknowledgment_rules.auto_acknowledge}
                    onChange={(e) => handleAcknowledgmentUpdate({ auto_acknowledge: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable auto-acknowledgment</span>
                </label>
                {config.acknowledgment_rules.auto_acknowledge && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Timeout:</span>
                    <input
                      type="number"
                      value={config.acknowledgment_rules.timeout_minutes}
                      onChange={(e) => handleAcknowledgmentUpdate({ timeout_minutes: parseInt(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">🎯 Assignment Rules</h3>
          <p className="text-sm text-gray-500">Automatic assignment settings and timeout configuration</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto Assignment</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={config.assignment_rules.auto_assign}
                    onChange={(e) => handleAssignmentUpdate({ auto_assign: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable auto-assignment</span>
                </label>
                {config.assignment_rules.auto_assign && (
                  <select
                    value={config.assignment_rules.assignment_type}
                    onChange={(e) => handleAssignmentUpdate({ assignment_type: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded"
                  >
                    <option value="manual">Manual</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="load_balanced">Load Balanced</option>
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Timeout</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.assignment_rules.timeout_minutes}
                  onChange={(e) => handleAssignmentUpdate({ timeout_minutes: parseInt(e.target.value) })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                />
                <span className="text-sm text-gray-500">minutes before escalation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Levels */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📈 Escalation Levels</h3>
            <p className="text-sm text-gray-500">Configure who gets assigned at each escalation level and timeout periods</p>
          </div>
          <button
            onClick={() => setShowAddLevel(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add Level
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {config.escalation_levels.map((level) => (
            <div key={level.level} className="p-4 hover:bg-gray-50 transition">
              {editingLevel === level.level ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={level.role}
                        onChange={(e) => handleEscalationUpdate(level.level, { role: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {ROLE_OPTIONS.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Timeout (min)</label>
                      <input
                        type="number"
                        value={level.timeout_minutes}
                        onChange={(e) => handleEscalationUpdate(level.level, { timeout_minutes: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Next Role</label>
                      <select
                        value={level.next_role}
                        onChange={(e) => handleEscalationUpdate(level.level, { next_role: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {ROLE_OPTIONS.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notifications</label>
                      <label className="inline-flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={level.notification_enabled}
                          onChange={(e) => handleEscalationUpdate(level.level, { notification_enabled: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enabled</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingLevel(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      L{level.level}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ROLE_OPTIONS.find(r => r.value === level.role)?.label || level.role}</p>
                      <p className="text-sm text-gray-500">
                        Timeout: {level.timeout_minutes} min → {ROLE_OPTIONS.find(r => r.value === level.next_role)?.label || level.next_role}
                        {level.notification_enabled && <span className="ml-2 text-green-600">🔔 Notifications ON</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLevel(level.level)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeEscalationLevel(level.level)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Closure Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">✅ Closure Rules</h3>
          <p className="text-sm text-gray-500">Who can close incidents and approval requirements</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Who can close incidents?</label>
            <div className="flex flex-wrap gap-4">
              {ROLE_OPTIONS.map(role => (
                <label key={role.value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={config.closure_rules.required_roles.includes(role.value)}
                    onChange={(e) => {
                      const newRoles = e.target.checked
                        ? [...config.closure_rules.required_roles, role.value]
                        : config.closure_rules.required_roles.filter(r => r !== role.value);
                      handleClosureUpdate({ required_roles: newRoles });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval Requirements</label>
            <div className="space-y-3">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.closure_rules.require_approval}
                  onChange={(e) => handleClosureUpdate({ require_approval: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Require approval before closing</span>
              </label>
              {config.closure_rules.require_approval && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Who can approve?</label>
                  <div className="flex flex-wrap gap-4">
                    {ROLE_OPTIONS.map(role => (
                      <label key={role.value} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={config.closure_rules.approval_roles.includes(role.value)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...config.closure_rules.approval_roles, role.value]
                              : config.closure_rules.approval_roles.filter(r => r !== role.value);
                            handleClosureUpdate({ approval_roles: newRoles });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Level Modal */}
      {showAddLevel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddLevel(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Escalation Level</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level Number</label>
                  <input
                    type="number"
                    value={newLevel.level}
                    onChange={(e) => setNewLevel({ ...newLevel, level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newLevel.role}
                    onChange={(e) => setNewLevel({ ...newLevel, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (minutes)</label>
                  <input
                    type="number"
                    value={newLevel.timeout_minutes}
                    onChange={(e) => setNewLevel({ ...newLevel, timeout_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Role</label>
                  <select
                    value={newLevel.next_role}
                    onChange={(e) => setNewLevel({ ...newLevel, next_role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={newLevel.notification_enabled}
                      onChange={(e) => setNewLevel({ ...newLevel, notification_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Notifications</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddLevel(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={addEscalationLevel} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Level
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
