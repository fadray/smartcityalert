'use client';

import { useState, useEffect } from 'react';
import { Card, Button, TextInput, Badge } from '@tremor/react';
import { Plus, Edit2, Trash2, Users, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
  stats?: {
    staff_count: number;
    active_incidents: number;
    resolved_today: number;
  };
}

export function DepartmentsList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      // Fetch stats for each department
      const withStats = await Promise.all(data.map(async (dept: Department) => {
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/department/${dept.id}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const stats = await statsRes.json();
        return { ...dept, stats };
      }));
      
      setDepartments(withStats);
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingDept 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/departments/${editingDept.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/departments`;
      
      const method = editingDept ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingDept ? 'Department updated' : 'Department created');
        setShowModal(false);
        setEditingDept(null);
        setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
        fetchDepartments();
      }
    } catch (error) {
      toast.error('Failed to save department');
    }
  };

  const getDepartmentGradient = (color: string) => {
    return `linear-gradient(135deg, ${color}20, ${color}40)`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Departments</h2>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-lg transition" style={{ background: getDepartmentGradient(dept.color) }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                  <h3 className="font-bold text-lg">{dept.name}</h3>
                  <Badge size="xs">{dept.code}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  setEditingDept(dept);
                  setFormData({
                    name: dept.name,
                    code: dept.code,
                    description: dept.description || '',
                    color: dept.color,
                  });
                  setShowModal(true);
                }}>
                  <Edit2 size={16} className="text-blue-600" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-lg p-2">
                <Users size={16} className="mx-auto mb-1 text-gray-500" />
                <p className="text-sm font-bold">{dept.stats?.staff_count || 0}</p>
                <p className="text-xs text-gray-500">Staff</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <Activity size={16} className="mx-auto mb-1 text-orange-500" />
                <p className="text-sm font-bold">{dept.stats?.active_incidents || 0}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <Badge size="xs" color="green">✓</Badge>
                <p className="text-sm font-bold mt-1">{dept.stats?.resolved_today || 0}</p>
                <p className="text-xs text-gray-500">Resolved Today</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingDept ? 'Edit Department' : 'Add Department'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <TextInput
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code (e.g., SEC, MED)</label>
                <TextInput
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDept ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
