export const API_ROUTES = {
  authLogin: '/auth/login',
  authMe: '/auth/me',
  incidents: '/incidents',
  incidentsAll: '/incidents/all',
  incidentsDraft: '/incidents/draft',
  incidentsAutoSave: '/incidents/auto-save',
  notifications: '/notifications',
  notificationsReadAll: '/notifications/read-all',
  adminUsers: '/admin/users',
  adminAudit: '/admin/audit',
} as const;

export const apiRoutes = {
  incidentById: (id: string) => `/incidents/${id}`,
  incidentAssign: (id: string) => `/incidents/${id}/assign`,
  incidentAudit: (id: string) => `/incidents/${id}/audit`,
  adminAuditByIncidentId: (id: string) => `/admin/audit/${id}`,
} as const;
