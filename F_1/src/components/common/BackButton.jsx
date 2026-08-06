import { ChevronLeft } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

export default function BackButton({ label = 'Go Back', className = '' }) {
  const { navigate } = useRouter();

  const handleBack = () => {
    // Try to go back in browser history
    // Using a try-catch as history.back() doesn't always work reliably
    try {
      const currentState = window.history.state;
      // If we have a previous state, use back()
      if (currentState !== null) {
        window.history.back();
      } else {
        // Fallback to home if no history
        navigate('/');
      }
    } catch {
      // Fallback to home if history access fails
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
