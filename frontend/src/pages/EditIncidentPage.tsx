import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Incident, ApiResponse, Severity, Status, UpdateIncidentDto, ApiErrorResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { apiRoutes } from '../config/apiRoutes';
import { APP_ROUTES, routePaths } from '../config/routes';

const EditIncidentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, user: currentUser } = useAuth();
  const { data: users } = useUsers();

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Incident>>(apiRoutes.incidentById(id!));
      return response.data.data;
    },
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>(Severity.LOW);
  const [status, setStatus] = useState<Status>(Status.OPEN);
  const [assignedToId, setAssignedToId] = useState<string>('');

  useEffect(() => {
    if (incident) {
      setTitle(incident.title);
      setDescription(incident.description || '');
      setSeverity(incident.severity);
      setStatus(incident.status);
      setAssignedToId(incident.assignedToId || '');
    }
  }, [incident]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateIncidentDto) => {
      const response = await apiClient.patch<ApiResponse<Incident>>(apiRoutes.incidentById(id!), data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      navigate(routePaths.incidentDetail(id!));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      title,
      description: description || undefined,
      severity,
      status,
      assignedToId: assignedToId || undefined,
    });
  };

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

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Incident</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          ></textarea>
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
            Severity
          </label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {Object.values(Severity).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {Object.values(Status).filter((s) => s !== Status.DRAFT).map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
              Assign To
            </label>
            <select
              id="assignedTo"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {currentUser?.id && <option value={currentUser.id}>Me</option>}
              {users?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader />}
            {updateMutation.isPending ? 'Updating...' : 'Update Incident'}
          </button>
          <button
            type="button"
            onClick={() => navigate(routePaths.incidentDetail(id!))}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditIncidentPage;
