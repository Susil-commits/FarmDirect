import { useLoading } from '../../context/LoadingContext';
import LoadingSpinner from './LoadingSpinner';

export default function GlobalPageLoader() {
  const { isPageLoading, loadingMessage } = useLoading();

  if (!isPageLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-xl p-12 shadow-2xl flex flex-col items-center gap-4 animate-scale-in">
        <LoadingSpinner size="lg" text="" />
        <p className="text-gray-700 font-semibold text-center max-w-xs">
          {loadingMessage}
        </p>
        <div className="text-xs text-gray-500 mt-2">
          Please wait...
        </div>
      </div>
    </div>
  );
}
