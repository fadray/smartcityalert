'use client';

import { useState } from 'react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  is_active: boolean;
}

interface DepartmentCardProps {
  department: Department;
  token: string;
  onRefresh: () => void;
  onEdit: (department: Department) => void;
}

export default function DepartmentCard({ department, token, onRefresh, onEdit }: DepartmentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white relative" style={{ borderTopColor: department.color, borderTopWidth: '4px' }}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{department.name}</h3>
          <p className="text-xs text-gray-500">Code: {department.code}</p>
        </div>
        
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{department.description || 'No description provided'}</p>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: department.color }}></div>
          <span className="text-xs text-gray-500">Active</span>
        </div>
        <button
          onClick={() => alert('View members')}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <UsersIcon className="h-3 w-3" />
          View Members
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-0 top-12 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <button
            onClick={() => {
              onEdit(department);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Department
          </button>
          <button
            onClick={() => {
              alert('View staff/users');
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <UsersIcon className="h-4 w-4" />
            View Staff/Users
          </button>
          <button
            onClick={() => {
              alert('Delete department');
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Department
          </button>
        </div>
      )}
    </div>
  );
}
