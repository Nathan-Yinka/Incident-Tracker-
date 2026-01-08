interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

const Loader = ({ size = 'md' }: LoaderProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-b',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-12 w-12 border-b-2',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-indigo-600`}></div>
    </div>
  );
};

export default Loader;

