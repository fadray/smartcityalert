'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../utils/api';
import { Department, User } from '../../types';
import { 
  PencilIcon, 
  TrashIcon, 
  KeyIcon, 
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface UserManagementProps {
  token: string;
  onRefresh?: () => void;
}

export default function UserManagement({ token, onRefresh }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'responder',
    department_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    const api = apiClient(token);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const api = apiClient(token);
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const api = apiClient(token);
    try {
      await api.post('/api/users', formData);
      alert('User created successfully');
      setShowModal(false);
      resetForm();
      fetchUsers();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const api = apiClient(token);
    try {
      await api.put(`/api/users/${editingUser.id}`, {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        department_id: formData.department_id,
      });
      alert('User updated successfully');
      setShowModal(false);
      resetForm();
      fetchUsers();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    const api = apiClient(token);
    try {
      await api.delete(`/api/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const api = apiClient(token);
    try {
      await api.put(`/api/users/${user.id}`, { is_active: !user.is_active });
      alert(`User ${user.is_active ? 'disabled' : 'enabled'} successfully`);
      fetchUsers();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }
    const api = apiClient(token);
    try {
      await api.post(`/api/users/${selectedUser.id}/reset-password`, { password: newPassword });
      alert(`Password reset for ${selectedUser.full_name}. New password: ${newPassword}`);
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    }
  };

  const handleSendResetEmail = async (user: User) => {
    const api = apiClient(token);
    try {
      await api.post(`/api/users/${user.id}/send-reset-email`);
      alert(`Password reset email sent to ${user.email || user.phone}`);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      alert('Failed to send reset email');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      phone: user.phone,
      email: user.email || '',
      password: '',
      role: user.role,
      department_id: user.department_id || '',
    });
    setShowModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      password: '',
      role: 'responder',
      department_id: '',
    });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      overall_director: 'bg-red-100 text-red-800',
      overall_manager: 'bg-orange-100 text-orange-800',
      dept_director: 'bg-blue-100 text-blue-800',
      hod: 'bg-cyan-100 text-cyan-800',
      supervisor: 'bg-green-100 text-green-800',
      responder: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Department</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((userItem) => (
              <tr key={userItem.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{userItem.full_name}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userItem.phone}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userItem.email || '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(userItem.role)}`}>
                    {userItem.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userItem.department?.name || '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {userItem.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(userItem)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit User"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openPasswordModal(userItem)}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Reset Password"
                    >
                      <KeyIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleSendResetEmail(userItem)}
                      className="text-green-600 hover:text-green-800"
                      title="Send Reset Email"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(userItem)}
                      className={userItem.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                      title={userItem.is_active ? 'Disable User' : 'Enable User'}
                    >
                      {userItem.is_active ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userItem.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete User"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="responder">Responder</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="hod">Head of Department</option>
                      <option value="dept_director">Department Director</option>
                      <option value="overall_manager">Overall Manager</option>
                      <option value="overall_director">Overall Director</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPasswordModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reset Password for {selectedUser.full_name}
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Password will be shown to the user. They can change it later.</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
