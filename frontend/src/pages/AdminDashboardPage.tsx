import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminIncidentsPage from './admin/AdminIncidentsPage';
import { APP_ROUTES } from '../config/routes';

const AdminDashboardPage = () => {
  const location = useLocation();

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <Link
              to={APP_ROUTES.adminUsers}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                location.pathname.includes(APP_ROUTES.adminUsers)
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </Link>
            <Link
              to={APP_ROUTES.adminIncidents}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                location.pathname.includes(APP_ROUTES.adminIncidents)
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Incidents
            </Link>
          </nav>
        </div>

        <div className="p-6">
          <Routes>
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="incidents" element={<AdminIncidentsPage />} />
            <Route index element={<AdminUsersPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
