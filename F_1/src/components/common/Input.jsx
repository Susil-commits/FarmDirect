export default function Input({
  label,
  type = 'text',
  placeholder = '',
  error = '',
  required = false,
  glass = true,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full px-4 py-3 backdrop-blur focus:outline-none focus:ring-2 transition-all rounded-xl ${
          glass
            ? `glass-input ${error ? 'border-red-400' : ''}  focus:ring-green-400`
            : `bg-white border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:border-green-500`
        }`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}
