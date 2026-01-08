import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Incident, ApiResponse, PaginatedResponse, Severity, Status } from '../../types';

const AdminIncidentsPage = () => {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [status, setStatus] = useState<Status | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-incidents', page, severity, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (severity) params.append('severity', severity);
      if (status) params.append('status', status);

      const response = await apiClient.get<ApiResponse<PaginatedResponse<Incident>>>(
        `/incidents/all?${params.toString()}`,
      );
      return response.data.data;
    },
  });

  if (isLoading) return <div className="text-center py-8"><Loader /></div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Incidents</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value={Severity.LOW}>Low</option>
            <option value={Severity.MEDIUM}>Medium</option>
            <option value={Severity.HIGH}>High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value={Status.OPEN}>Open</option>
            <option value={Status.IN_PROGRESS}>In Progress</option>
            <option value={Status.RESOLVED}>Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {data?.data.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{incident.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created by: {incident.user?.email || 'Unknown'}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      incident.severity === Severity.HIGH
                        ? 'bg-red-100 text-red-800'
                        : incident.severity === Severity.MEDIUM
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {incident.severity}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      incident.status === Status.RESOLVED
                        ? 'bg-green-100 text-green-800'
                        : incident.status === Status.IN_PROGRESS
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {incident.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {data && data.total > 10 && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Page {page} of {Math.ceil(data.total / 10)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="px-3 py-1 border rounded disabled:opacity-50"
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

export default AdminIncidentsPage;

