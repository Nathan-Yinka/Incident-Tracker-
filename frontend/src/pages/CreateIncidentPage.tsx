import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { CreateIncidentDto, Incident, ApiResponse, Severity } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import Loader from '../components/Loader';

const CreateIncidentPage = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { data: users } = useUsers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>(Severity.LOW);
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: draft } = useQuery({
    queryKey: ['draft'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Incident | null>>('/incidents/draft');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (draft) {
      setHasDraft(true);
      setDraftId(draft.id);
      setShowDraftAlert(true);
      if (draft.assignedToId) {
        setAssignedToId(draft.assignedToId);
      }
    } else {
      setHasDraft(false);
      setDraftId(null);
      setShowDraftAlert(false);
    }
  }, [draft]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateIncidentDto) => {
      const response = await apiClient.post<ApiResponse<Incident>>('/incidents', data);
      return response.data.data;
    },
    onSuccess: () => {
      navigate('/incidents');
    },
  });

  const autoSaveMutation = useMutation({
    mutationFn: async (data: Partial<CreateIncidentDto>) => {
      const response = await apiClient.post<ApiResponse<Incident>>('/incidents/auto-save', data);
      return response.data.data;
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete<ApiResponse<null>>('/incidents/draft');
    },
    onSuccess: () => {
      setHasDraft(false);
      setDraftId(null);
      setShowDraftAlert(false);
    },
  });

  const handleAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (title.trim() || description.trim() || draftId) {
        autoSaveMutation.mutate({
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          severity,
          assignedToId: assignedToId || undefined,
        });
      }
    }, 2000);
  };

  const handleTitleBlur = () => {
    handleAutoSave();
  };

  const handleDescriptionBlur = () => {
    handleAutoSave();
  };

  const handleSeverityChange = (newSeverity: Severity) => {
    setSeverity(newSeverity);
    handleAutoSave();
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Set default assignedToId to admin's own ID when admin creates incident (if no draft)
  useEffect(() => {
    if (isAdmin && user?.id && !draft && !assignedToId) {
      setAssignedToId(user.id);
    }
  }, [isAdmin, user?.id, draft, assignedToId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description,
      severity,
      isDraft: false,
      assignedToId: assignedToId || undefined,
    });
  };

  const handleContinueFromDraft = () => {
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description || '');
      setSeverity(draft.severity);
      setAssignedToId(draft.assignedToId || '');
      setShowDraftAlert(false);
    }
  };

  const handleStartNew = () => {
    deleteDraftMutation.mutate();
    setTitle('');
    setDescription('');
    setSeverity(Severity.LOW);
    setAssignedToId('');
    setShowDraftAlert(false);
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      {showDraftAlert && hasDraft && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800 mb-2">You have a draft incident. Would you like to continue from it or start a new one?</p>
          <div className="flex space-x-2">
            <button
              onClick={handleContinueFromDraft}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Continue from Draft
            </button>
            <button
              onClick={handleStartNew}
              disabled={deleteDraftMutation.isPending}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {deleteDraftMutation.isPending && <Loader />}
              {deleteDraftMutation.isPending ? 'Deleting...' : 'Start New'}
            </button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Incident</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            ref={descriptionInputRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
          <select
            value={severity}
            onChange={(e) => handleSeverityChange(e.target.value as Severity)}
            onBlur={handleAutoSave}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={Severity.LOW}>Low</option>
            <option value={Severity.MEDIUM}>Medium</option>
            <option value={Severity.HIGH}>High</option>
          </select>
        </div>

        {isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              value={assignedToId}
              onChange={(e) => {
                setAssignedToId(e.target.value);
                handleAutoSave();
              }}
              onBlur={handleAutoSave}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {user?.id && <option value={user.id}>Me</option>}
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {autoSaveMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Loader />
            <span>Saving draft...</span>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending && <Loader />}
            {createMutation.isPending ? 'Creating...' : 'Create Incident'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIncidentPage;
