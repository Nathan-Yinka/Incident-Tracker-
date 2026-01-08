import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../config/routes';

const AccessDeniedPage = () => {
  return (
    <div className="px-4 py-10 max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-3 text-gray-600">
          You do not have access to this incident or page.
        </p>
        <Link
          to={APP_ROUTES.incidents}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Back to My Incidents
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
