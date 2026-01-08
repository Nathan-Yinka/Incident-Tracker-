import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import IncidentListPage from './pages/IncidentListPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import EditIncidentPage from './pages/EditIncidentPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { APP_ROUTES } from './config/routes';

function App() {
  const toNestedPath = (route: string) => route.replace(/^\//, '');

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={APP_ROUTES.login} element={<LoginPage />} />
          <Route
            path={APP_ROUTES.root}
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={APP_ROUTES.incidents} replace />} />
            <Route path={toNestedPath(APP_ROUTES.incidents)} element={<IncidentListPage />} />
            <Route path={toNestedPath(APP_ROUTES.incidentNew)} element={<CreateIncidentPage />} />
            <Route path={toNestedPath(APP_ROUTES.incidentDetail)} element={<IncidentDetailPage />} />
            <Route path={toNestedPath(APP_ROUTES.incidentEdit)} element={<EditIncidentPage />} />
            <Route path={toNestedPath(APP_ROUTES.notifications)} element={<NotificationsPage />} />
            <Route path={toNestedPath(APP_ROUTES.accessDenied)} element={<AccessDeniedPage />} />
            <Route path={toNestedPath(APP_ROUTES.admin)} element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
