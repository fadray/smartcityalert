'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Button, TextInput, Select, SelectItem } from '@tremor/react';
import { UserPlus, Edit2, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  department_id: string;
  department_name: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/${editingUser.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingUser ? 'User updated' : 'User created');
        setShowModal(false);
        setEditingUser(null);
        setFormData({ full_name: '', phone: '', email: '', password: '', role: 'responder', department_id: '' });
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      overall_director: 'purple',
      overall_manager: 'indigo',
      dept_director: 'blue',
      hod: 'cyan',
      supervisor: 'green',
      responder: 'emerald',
      admin: 'red',
    };
    return colors[role] || 'gray';
  };

  const getRoleLabel = (role: string) => {
    const labels: any = {
      overall_director: 'Overall Director',
      overall_manager: 'Overall Manager',
      dept_director: 'Dept Director',
      hod: 'Head of Department',
      supervisor: 'Supervisor',
      responder: 'Responder',
      admin: 'Admin',
    };
    return labels[role] || role;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Users & Roles</h2>
        <Button
          icon={UserPlus}
          onClick={() => {
            setEditingUser(null);
            setFormData({ full_name: '', phone: '', email: '', password: '', role: 'responder', department_id: '' });
            setShowModal(true);
          }}
        >
          Add User
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{user.full_name}</td>
                <td className="px-6 py-4 text-sm">{user.phone}</td>
                <td className="px-6 py-4">
                  <Badge color={getRoleBadgeColor(user.role)} className="capitalize">
                    {getRoleLabel(user.role)}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm">{user.department_name || '-'}</td>
                <td className="px-6 py-4">
                  <Badge color={user.is_active ? 'green' : 'red'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
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
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <TextInput
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <TextInput
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <TextInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <TextInput
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectItem value="responder">Responder/Staff</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="hod">Head of Department</SelectItem>
                  <SelectItem value="dept_director">Department Director</SelectItem>
                  <SelectItem value="overall_manager">Overall Manager</SelectItem>
                  <SelectItem value="overall_director">Overall Director</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </Select>
              </div>
              {formData.role !== 'admin' && formData.role !== 'overall_manager' && formData.role !== 'overall_director' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectItem value="">Select Department</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              )}
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
