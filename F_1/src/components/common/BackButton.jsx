import { ChevronLeft } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

export default function BackButton({ label = 'Go Back', className = '' }) {
  const { navigate } = useRouter();

  const handleBack = () => {
    
    try {
      const currentState = window.history.state;
      
      if (currentState !== null) {
        window.history.back();
      } else {
        
        navigate('/');
      }
    } catch {
      
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
