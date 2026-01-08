import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Notification, ApiResponse, PaginatedResponse } from '../types';

const NotificationsPage = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const processedIdsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter === 'unread') {
        params.append('isRead', 'false');
      }

      const response = await apiClient.get<ApiResponse<PaginatedResponse<Notification> & { unreadCount?: number }>>(
        `/notifications?${params.toString()}`,
      );
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
    },
  });

  useEffect(() => {
    if (data?.data) {
      const unreadNotifications = data.data.filter(
        (n) => !n.isRead && !processedIdsRef.current.has(n.id)
      );
      
      if (unreadNotifications.length > 0) {
        const idsToMark = unreadNotifications.map((n) => n.id);
        
        idsToMark.forEach((id) => {
          processedIdsRef.current.add(id);
          markAsReadMutation.mutate(id);
        });
      }
    }
  }, [data?.data]);

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch<ApiResponse<null>>('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  const unreadCount = (data as PaginatedResponse<Notification> & { unreadCount?: number })?.unreadCount || 0;

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              {unreadCount} unread
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All as Read'}
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter('unread');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unread
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="divide-y divide-gray-200">
          {data?.data && data.data.length > 0 ? (
            data.data.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    {notification.incident && (
                      <Link
                        to={`/incidents/${notification.incident.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                      >
                        View Incident →
                      </Link>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className="ml-4 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">No notifications found</div>
          )}
        </div>

        {data && data.total > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= data.total}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

