import { Link } from 'react-router-dom';

type ErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
};

const ErrorState = ({ title, message, actionLabel, actionTo }: ErrorStateProps) => {
  return (
    <div className="px-4 py-10 max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-3 text-gray-600">{message}</p>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="mt-6 inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
