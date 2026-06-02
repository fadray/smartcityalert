'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusCircleIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', icon: HomeIcon, id: 'dashboard' },
  { name: 'Incidents', icon: ExclamationTriangleIcon, id: 'incidents' },
  { name: 'Pending Approvals', icon: ClockIcon, id: 'pending-approvals' },
  { name: 'Maintenance', icon: WrenchIcon, id: 'maintenance' },
  { name: 'Report Incident', icon: PlusCircleIcon, id: 'report' },
  { name: 'Users', icon: UsersIcon, id: 'users' },
  { name: 'Departments', icon: BuildingOfficeIcon, id: 'departments' },
  { name: 'Reports', icon: ChartBarIcon, id: 'reports' },
  { name: 'Workflow', icon: Cog6ToothIcon, id: 'workflow' },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  pendingCount?: number;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, userRole, pendingCount = 0 }: SidebarProps) {
  const isAdmin = userRole === 'admin' || userRole === 'overall_director' || userRole === 'overall_manager';
  
  const visibleNavigation = navigation.filter(item => {
    if (item.id === 'users' || item.id === 'departments' || item.id === 'workflow' || item.id === 'maintenance') {
      return isAdmin;
    }
    return true;
  });

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">SmartCityAlert</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {visibleNavigation.map((item) => (
                            <li key={item.name}>
                              <button
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setSidebarOpen(false);
                                }}
                                className={`
                                  group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 w-full text-left transition-all duration-200
                                  ${activeTab === item.id 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                  }
                                `}
                              >
                                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                {item.name}
                                {item.id === 'pending-approvals' && pendingCount > 0 && (
                                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                                    {pendingCount}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">SmartCityAlert</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {visibleNavigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 w-full text-left transition-all duration-200
                          ${activeTab === item.id 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                        {item.id === 'pending-approvals' && pendingCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                            {pendingCount}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
