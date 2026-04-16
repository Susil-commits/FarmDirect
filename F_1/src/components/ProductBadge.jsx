import { getBadgeConfig } from '../utils/badgeCalculation';
import './ProductBadge.css';

export default function ProductBadge({ badgeType, showTooltip = true }) {
  const config = getBadgeConfig(badgeType);

  if (!config) return null;

  return (
    <div className={`product-badge badge-${config.color}`} title={showTooltip ? config.tooltip : ''}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-label">{config.label}</span>
    </div>
  );
}
