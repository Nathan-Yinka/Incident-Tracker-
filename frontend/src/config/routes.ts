export const APP_ROUTES = {
  login: '/login',
  root: '/',
  incidents: '/incidents',
  incidentNew: '/incidents/new',
  incidentDetail: '/incidents/:id',
  incidentEdit: '/incidents/:id/edit',
  notifications: '/notifications',
  accessDenied: '/access-denied',
  admin: '/admin/*',
  adminUsers: '/admin/users',
  adminIncidents: '/admin/incidents',
} as const;

export const routePaths = {
  incidentDetail: (id: string) => `/incidents/${id}`,
  incidentEdit: (id: string) => `/incidents/${id}/edit`,
  adminRoot: '/admin',
} as const;
