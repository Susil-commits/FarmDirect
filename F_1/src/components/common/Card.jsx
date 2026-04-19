export default function Card({ children, className = '', hover = true, animated = true, _glass = true, variant = 'default' }) {
  const hoverClass = hover ? 'premium-hover' : '';
  const animatedClass = animated ? 'stagger-item' : '';
  
  const variantClass = {
    default: 'glass',
    deep: 'glass-deep',
    light: 'glass-light',
    green: 'glass-green',
  }[variant];
  
  return (
    <div className={`${variantClass} rounded-xl transition-smooth ${hoverClass} ${animatedClass} ${className}`}>
      {children}
    </div>
  );
}
