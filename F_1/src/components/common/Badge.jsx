export default function Badge({ label, variant = 'primary', size = 'md', className = '' }) {
  const variants = {
    primary: 'bg-green-100 text-green-800',
    secondary: 'bg-gray-100 text-gray-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-block rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {label}
    </span>
  );
}
