import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Incident, ApiResponse, PaginatedResponse, Severity, Status, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';
import { API_ROUTES } from '../config/apiRoutes';
import { APP_ROUTES, routePaths } from '../config/routes';

type ViewMode = 'my' | 'all';

const IncidentListPage = () => {
  const { isAdmin, user } = useAuth();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('my');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [debouncedSearch]);

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
        `${API_ROUTES.adminUsers}?limit=100`,
      );
      return response.data.data;
    },
    enabled: isAdmin && viewMode === 'all',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['incidents', page, severity, status, debouncedSearch, viewMode, isAdmin, user?.id, selectedUserId],
    queryFn: async () => {
      let endpoint: string = API_ROUTES.incidents;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (isAdmin) {
        if (viewMode === 'all') {
          endpoint = API_ROUTES.incidentsAll;
          if (selectedUserId) {
            params.append('userId', selectedUserId);
          }
        } else if (viewMode === 'my' && user?.id) {
          endpoint = API_ROUTES.incidentsAll;
          params.append('userId', user.id);
        }
      }
      
      if (severity) params.append('severity', severity);
      if (status) params.append('status', status);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const response = await apiClient.get<ApiResponse<PaginatedResponse<Incident>>>(
        `${endpoint}?${params.toString()}`,
      );
      return response.data.data;
    },
    enabled: !!user,
  });

  const handleFilterChange = () => {
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md inline-block">
          Error loading incidents. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
        <Link
          to={APP_ROUTES.incidentNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
        >
          Create Incident
        </Link>
      </div>

      {isAdmin && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setViewMode('my');
              setSelectedUserId('');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'my'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            My Incidents
          </button>
          <button
            onClick={() => {
              setViewMode('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Incidents
          </button>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className={`grid grid-cols-1 gap-4 ${isAdmin && viewMode === 'all' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {isAdmin && viewMode === 'all' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Users</option>
                  {usersData?.data.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as Severity | '');
                  handleFilterChange();
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value={Severity.LOW}>Low</option>
                <option value={Severity.MEDIUM}>Medium</option>
                <option value={Severity.HIGH}>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Status | '');
                  handleFilterChange();
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value={Status.OPEN}>Open</option>
                <option value={Status.IN_PROGRESS}>In Progress</option>
                <option value={Status.RESOLVED}>Resolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                {isAdmin && viewMode === 'all' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data && data.data.length > 0 ? (
                data.data.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = routePaths.incidentDetail(incident.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md truncate">
                        {incident.description || '-'}
                      </div>
                    </td>
                    {isAdmin && viewMode === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {incident.user?.email || '-'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          incident.severity === Severity.HIGH
                            ? 'bg-red-100 text-red-800'
                            : incident.severity === Severity.MEDIUM
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          incident.status === Status.RESOLVED
                            ? 'bg-green-100 text-green-800'
                            : incident.status === Status.IN_PROGRESS
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {incident.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin && viewMode === 'all' ? 6 : 5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <p className="text-lg">No incidents found</p>
                    <p className="text-sm mt-2">Try adjusting your filters or create a new incident</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * 10, data.total)}</span> of{' '}
              <span className="font-medium">{data.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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

export default IncidentListPage;
