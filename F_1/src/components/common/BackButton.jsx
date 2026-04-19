import { ChevronLeft } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

export default function BackButton({ label = 'Go Back', className = '' }) {
  const { navigate } = useRouter();

  const handleBack = () => {
    // Try to go to previous history, fallback to home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 cursor-pointer ${className}`}
      title={label}
    >
      <ChevronLeft size={20} />
      <span>{label}</span>
    </button>
  );
}
