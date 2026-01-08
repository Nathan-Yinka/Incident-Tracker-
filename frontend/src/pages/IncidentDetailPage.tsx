import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Incident, ApiResponse, Severity, Status, UpdateIncidentDto, AuditLog } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';

const IncidentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const { data: users } = useUsers();
  const [showAudit, setShowAudit] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Incident>>(`/incidents/${id}`);
      return response.data.data;
    },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['incident-audit', id],
    queryFn: async () => {
      const endpoint = isAdmin ? `/admin/audit/${id}` : `/incidents/${id}/audit`;
      const response = await apiClient.get<ApiResponse<AuditLog[]>>(endpoint);
      return response.data.data;
    },
    enabled: showAudit && !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: Status) => {
      const response = await apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}`, {
        status: newStatus,
      } as UpdateIncidentDto);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (assignedToId: string) => {
      const response = await apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}/assign`, {
        assignedToId: assignedToId || undefined,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setShowAssignModal(false);
      setSelectedUserId('');
    },
  });

  const handleStatusChange = (newStatus: Status) => {
    updateStatusMutation.mutate(newStatus);
  };

  const canEdit = isAdmin || (user?.id === incident?.userId);

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error loading incident</div>;
  if (!incident) return <div className="text-center py-8">Incident not found</div>;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <Link
        to="/incidents"
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Incidents
      </Link>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
          <div className="flex space-x-2 items-center">
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${
                incident.severity === Severity.HIGH
                  ? 'bg-red-100 text-red-800'
                  : incident.severity === Severity.MEDIUM
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {incident.severity}
            </span>
            {canEdit ? (
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                disabled={updateStatusMutation.isPending}
                className={`px-3 py-1 text-sm font-medium rounded border ${
                  incident.status === Status.RESOLVED
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : incident.status === Status.IN_PROGRESS
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                {Object.values(Status).filter((s) => s !== Status.DRAFT).map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={`px-3 py-1 text-sm font-medium rounded ${
                  incident.status === Status.RESOLVED
                    ? 'bg-green-100 text-green-800'
                    : incident.status === Status.IN_PROGRESS
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {incident.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="mb-4 flex space-x-2">
            <Link
              to={`/incidents/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Edit Incident
            </Link>
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedUserId(incident.assignedToId || '');
                  setShowAssignModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Assign
              </button>
            )}
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {showAudit ? 'Hide' : 'Show'} Audit Trail
            </button>
          </div>
        )}

        {incident.description && (
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{incident.user?.email || 'Unknown'}</dd>
            </div>
            {incident.assignedTo && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900">{incident.assignedTo.email}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(incident.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(incident.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {showAudit && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Trail</h3>
            {auditLoading ? (
              <div className="text-center py-4">Loading audit trail...</div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                        {log.user && (
                          <p className="text-xs text-gray-500 mt-1">By: {log.user.email}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No audit logs found</div>
            )}
          </div>
        )}

        {showAssignModal && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Incident</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Unassigned</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUserId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignMutation.mutate(selectedUserId)}
                  disabled={assignMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetailPage;

