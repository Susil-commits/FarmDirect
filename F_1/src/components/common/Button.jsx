export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  animated = true,
  glass = false,
  ...props
}) {
  const baseStyles = 'font-semibold focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-xl transition-fast active:scale-95 backdrop-blur';

  const variants = glass ? {
    primary: 'glass glass-green text-green-700 hover:bg-green-50 focus:ring-green-400 border border-green-200',
    secondary: 'glass text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    danger: 'glass text-red-600 hover:bg-red-50 focus:ring-red-400 border border-red-200',
    outline: 'glass-light border-2 border-green-400 text-green-700 focus:ring-green-400',
  } : {
    primary: 'bg-gradient-to-br from-green-600 to-green-700 text-white hover:shadow-lg focus:ring-green-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover:shadow-lg',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500 hover:shadow-md',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer premium-hover';
  const animatedClass = animated ? 'hover:shadow-lg' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${animatedClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
