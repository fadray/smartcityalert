'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { BellIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { apiClient } from '../../utils/api';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  incident_id?: string;
}

interface NotificationBellProps {
  token: string;
  userId: string;
}

export default function NotificationBell({ token, userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('NotificationBell mounted with userId:', userId);
    fetchNotifications();
    
    // Setup WebSocket connection for real-time notifications
    if (token && userId) {
      const socket = io('http://localhost:3001', {
        transports: ['websocket'],
        auth: { token }
      });
      
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('Notification socket connected');
        socket.emit('join', userId);
      });
      
      socket.on('new_notification', (notification: Notification) => {
        console.log('New notification received via WebSocket:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Play sound for high priority notifications
        if (notification.priority === 'urgent' || notification.priority === 'high') {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }
    
    // Poll for notifications every 10 seconds as fallback
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(interval);
    };
  }, [token, userId]);

  const fetchNotifications = async () => {
    if (!token) return;
    console.log('Fetching notifications...');
    const api = apiClient(token);
    try {
      const res = await api.get('/api/notifications/unread');
      console.log('Fetched notifications:', res.data);
      setNotifications(res.data);
      setUnreadCount(res.data.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const api = apiClient(token);
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const api = apiClient(token);
    try {
      for (const notification of notifications) {
        await api.put(`/api/notifications/${notification.id}/read`);
      }
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-50',
      medium: 'bg-blue-50',
      high: 'bg-yellow-50',
      urgent: 'bg-red-50',
    };
    return colors[priority] || 'bg-gray-50';
  };

  const getPriorityBorderColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'border-gray-200',
      medium: 'border-blue-200',
      high: 'border-yellow-200',
      urgent: 'border-red-200',
    };
    return colors[priority] || 'border-gray-200';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      new_incident: '🚨',
      status_change: '📊',
      assignment: '📋',
      escalation: '⚠️',
      resolution_proof: '📎',
      approval: '✅',
      rejection: '❌',
      test: '🔔',
    };
    return icons[type] || '🔔';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      new_incident: 'text-red-600',
      status_change: 'text-blue-600',
      assignment: 'text-green-600',
      escalation: 'text-orange-600',
      resolution_proof: 'text-purple-600',
      approval: 'text-green-600',
      rejection: 'text-red-600',
      test: 'text-gray-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button 
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative transition-colors duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-50 mt-2.5 w-96 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No new notifications</p>
                    <p className="text-xs text-gray-400 mt-1">When you receive notifications, they will appear here</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          className={`${active ? 'bg-gray-50' : 'bg-white'} ${getPriorityColor(notification.priority)} border-l-4 ${getPriorityBorderColor(notification.priority)} px-4 py-3 cursor-pointer transition-all duration-150 hover:shadow-sm`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`text-2xl ${getTypeColor(notification.type)}`}>
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 flex-shrink-0"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-400">
                                  {formatTime(notification.created_at)}
                                </p>
                                {notification.priority === 'urgent' && (
                                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                    Urgent
                                  </span>
                                )}
                                {notification.priority === 'high' && (
                                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                    High Priority
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <button
                    onClick={markAllAsRead}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
