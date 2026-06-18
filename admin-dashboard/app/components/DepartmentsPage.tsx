'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UsersIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
}

interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || '';
    setToken(savedToken);
    if (savedToken) {
      fetchDepartments(savedToken);
      fetchUsers(savedToken);
    }
  }, []);

  const fetchDepartments = async (authToken: string) => {
    try {
      const api = apiClient(authToken);
      const res = await api.get('/api/departments');
      setDepartments(res.data);
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (authToken: string) => {
    try {
      const api = apiClient(authToken);
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = apiClient(token);
      const url = editingDept 
        ? `/api/departments/${editingDept.id}`
        : '/api/departments';
      
      const method = editingDept ? 'put' : 'post';
      
      const res = await api[method](url, formData);

      if (res.status === 200 || res.status === 201) {
        toast.success(editingDept ? 'Department updated' : 'Department created');
        setShowModal(false);
        setEditingDept(null);
        setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
        fetchDepartments(token);
      } else {
        toast.error(res.data?.message || 'Operation failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const api = apiClient(token);
      await api.delete(`/api/departments/${departmentId}`);
      toast.success('Department deleted successfully');
      fetchDepartments(token);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const viewDepartmentUsers = (department: Department) => {
    const deptUsers = users.filter(user => user.department_id === department.id);
    setDepartmentUsers(deptUsers);
    setSelectedDepartment(department);
    setShowUsersModal(true);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your organization departments</p>
        </div>
        <button
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
          <p className="text-gray-500 mb-4">Create your first department to get started</p>
          <button
            onClick={() => {
              setEditingDept(null);
              setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible hover:shadow-md transition-shadow duration-200 relative"
              style={{ borderTopColor: dept.color, borderTopWidth: '4px' }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                      <h3 className="font-semibold text-gray-900 text-lg">{dept.name}</h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{dept.code}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dept.description || 'No description'}</p>
                  </div>
                  
                  <Menu as="div" className="relative z-20">
                    {({ open }) => (
                      <>
                        <Menu.Button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                        </Menu.Button>
                        <Transition
                          show={open}
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => {
                                    setEditingDept(dept);
                                    setFormData({
                                      name: dept.name,
                                      code: dept.code,
                                      description: dept.description || '',
                                      color: dept.color,
                                    });
                                    setShowModal(true);
                                  }}
                                  className={`${active ? 'bg-gray-100' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  Edit Department
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => viewDepartmentUsers(dept)}
                                  className={`${active ? 'bg-gray-100' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                                >
                                  <UsersIcon className="h-4 w-4" />
                                  View Staff ({users.filter(u => u.department_id === dept.id).length})
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleDelete(dept.id)}
                                  className={`${active ? 'bg-red-50' : ''} flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600`}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Delete Department
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            </div>
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
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {editingDept ? 'Edit Department' : 'Add Department'}
                    </Dialog.Title>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
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

      {/* View Users Modal */}
      <Transition appear show={showUsersModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowUsersModal(false)}>
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Staff in {selectedDepartment?.name}
                    </Dialog.Title>
                    <button onClick={() => setShowUsersModal(false)} className="text-gray-400 hover:text-gray-500">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {departmentUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No users in this department yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {departmentUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{user.full_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{user.phone}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(user.role)}`}>
                                  {user.role.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowUsersModal(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
