import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Incident, ApiResponse, Severity, Status, UpdateIncidentDto, AuditLog, User, ApiErrorResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { apiRoutes } from '../config/apiRoutes';
import { APP_ROUTES, routePaths } from '../config/routes';

const IncidentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { data: users } = useUsers();
  const usersById = users?.reduce<Record<string, User>>((acc, current) => {
    acc[current.id] = current;
    return acc;
  }, {});
  const [showAudit, setShowAudit] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [now, setNow] = useState(Date.now());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!showAudit) return;
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [showAudit]);

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Incident>>(apiRoutes.incidentById(id!));
      return response.data.data;
    },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['incident-audit', id],
    queryFn: async () => {
      const endpoint = isAdmin
        ? apiRoutes.adminAuditByIncidentId(id!)
        : apiRoutes.incidentAudit(id!);
      const response = await apiClient.get<ApiResponse<AuditLog[]>>(endpoint);
      return response.data.data;
    },
    enabled: showAudit && !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: Status) => {
      const response = await apiClient.patch<ApiResponse<Incident>>(apiRoutes.incidentById(id!), {
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
      const response = await apiClient.patch<ApiResponse<Incident>>(apiRoutes.incidentAssign(id!), {
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete<ApiResponse<null>>(apiRoutes.incidentById(id!));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      navigate(APP_ROUTES.incidents);
    },
  });

  const handleStatusChange = (newStatus: Status) => {
    updateStatusMutation.mutate(newStatus);
  };

  const canEdit = isAdmin
    || (user?.id === incident?.assignedToId)
    || (user?.id === incident?.userId);

  const errorStatus = (error as { response?: { status?: number } })?.response?.status;
  const errorMessage =
    (error as { response?: { data?: ApiErrorResponse } })?.response?.data?.message
    || 'Error loading incident';

  if (isLoading) return <div className="text-center py-8"><Loader /></div>;
  if (errorStatus === 404) {
    return (
      <ErrorState
        title="Incident not found"
        message="This incident does not exist or was removed."
        actionLabel="Back to My Incidents"
        actionTo={APP_ROUTES.incidents}
      />
    );
  }
  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={errorMessage}
        actionLabel="Back to My Incidents"
        actionTo={APP_ROUTES.incidents}
      />
    );
  }
  if (!incident) return <div className="text-center py-8">Incident not found</div>;

  const formatStatus = (value?: string) => (value ? value.replace('_', ' ') : 'Unknown');
  const formatRelativeTime = (timestamp: string) => {
    const diffMs = now - new Date(timestamp).getTime();
    if (diffMs < 0) return 'just now';
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };
  const formatAssignedLabel = (assignedToId?: string | null) => {
    if (!assignedToId) return 'Unassigned';
    if (assignedToId === user?.id) return 'you';
    return usersById?.[assignedToId]?.email || `user ${assignedToId}`;
  };
  const formatAuditMessage = (log: AuditLog) => {
    const oldValue = (log.oldValue || {}) as Record<string, unknown>;
    const newValue = (log.newValue || {}) as Record<string, unknown>;
    const actor = log.user?.email || 'Someone';
    const formatChangeList = (items: string[]) => {
      if (items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;
      return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
    };

    switch (log.action) {
      case 'CREATED':
        return `${actor} created the incident`;
      case 'DELETED':
        return `${actor} deleted the incident`;
      case 'STATUS_CHANGED': {
        const oldStatus = oldValue.status as string | undefined;
        const newStatus = newValue.status as string | undefined;
        if (oldStatus && newStatus) {
          return `${actor} changed the status from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}`;
        }
        return `${actor} updated the status`;
      }
      case 'ASSIGNED': {
        const oldAssigned = (oldValue.assignedToId as string | null | undefined) || null;
        const newAssigned = (newValue.assignedToId as string | null | undefined) || null;
        if (!newAssigned) {
          return `${actor} unassigned the incident`;
        }
        if (!oldAssigned) {
          return `${actor} assigned the incident to ${formatAssignedLabel(newAssigned)}`;
        }
        if (oldAssigned !== newAssigned) {
          return `${actor} reassigned the incident from ${formatAssignedLabel(oldAssigned)} to ${formatAssignedLabel(newAssigned)}`;
        }
        return `${actor} assigned the incident to ${formatAssignedLabel(newAssigned)}`;
      }
      case 'UPDATED': {
        const changes: string[] = [];
        if ('title' in newValue || 'title' in oldValue) changes.push('title');
        if ('description' in newValue || 'description' in oldValue) changes.push('description');
        if ('severity' in newValue || 'severity' in oldValue) changes.push('severity');
        if ('isDraft' in newValue || 'isDraft' in oldValue) changes.push('draft status');
        const list = formatChangeList(changes);
        return list ? `${actor} updated ${list}` : `${actor} updated the incident`;
      }
      default:
        return `${actor} ${log.action.replace('_', ' ').toLowerCase()}`;
    }
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <Link
        to={APP_ROUTES.incidents}
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
              <div className="relative flex items-center gap-2">
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
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50`}
                >
                  {Object.values(Status).filter((s) => s !== Status.DRAFT).map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {updateStatusMutation.isPending && <Loader size="sm" />}
              </div>
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
              to={routePaths.incidentEdit(id!)}
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
            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this incident? This action cannot be undone.')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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
              <div className="text-center py-4"><Loader /></div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatAuditMessage(log)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(log.createdAt)} · {new Date(log.createdAt).toLocaleString()}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {assignMutation.isPending && <Loader />}
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
