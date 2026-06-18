'use client';

import { useState, useEffect, Fragment } from 'react';
import { Button, TextInput } from '@tremor/react';
import { Plus } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import DepartmentCard from './Departments/DepartmentCard';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
}

export default function DepartmentsList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
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
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
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
      } else {
        const error = await res.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save department');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDept(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      color: department.color,
    });
    setShowModal(true);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  if (loading) {
    return <div className="text-center py-8">Loading departments...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Departments ({departments.length})</h2>
        <Button 
          icon={Plus} 
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
            setShowModal(true);
          }}
        >
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No departments yet. Click "Add Department" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              token={token}
              onRefresh={fetchDepartments}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Department Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {editingDept ? 'Edit Department' : 'Add Department'}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                      <TextInput
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code (e.g., SEC, MED)</label>
                      <TextInput
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-6">
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
                        {editingDept ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
