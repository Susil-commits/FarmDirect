import React from 'react';
import { Heart, ShoppingCart, List, Search, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import './SmartStates.css';

/**
 * EmptyState - Friendly empty state component
 * Shows helpful guidance when no data is available
 */
export function EmptyState({
  icon: Icon = Heart,
  title,
  description,
  action,
  actionLabel = 'Get Started',
  size = 'md',
  illustration,
}) {
  return (
    <div className={`empty-state empty-state-${size}`}>
      {illustration ? (
        <div className="empty-illustration">
          {illustration}
        </div>
      ) : (
        <div className="empty-icon">
          <Icon size={size === 'lg' ? 64 : 48} />
        </div>
      )}

      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>

      {action && (
        <Button variant="primary" onClick={action} className="empty-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * LoadingState - Smart loading indicator
 */
export function LoadingState({ title = 'Loading', messages = [] }) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    if (messages.length === 0) return;

    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [messages]);

  return (
    <div className="loading-state">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>

      <h3 className="loading-title">{title}</h3>

      {messages.length > 0 && (
        <p className="loading-tip" key={messageIndex}>
          💡 {messages[messageIndex]}
        </p>
      )}
    </div>
  );
}

/**
 * ErrorState - Error display with recovery options
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  error,
  onRetry,
  showDetails = false,
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="error-state">
      <div className="error-icon">
        <AlertCircle size={48} />
      </div>

      <h3 className="error-title">{title}</h3>
      <p className="error-description">{description}</p>

      {error && showDetails && (
        <div className="error-details">
          <button
            onClick={() => setExpanded(!expanded)}
            className="error-toggle"
          >
            {expanded ? 'Hide' : 'Show'} technical details
          </button>

          {expanded && (
            <pre className="error-message">
              {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      )}

      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="error-retry">
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * ContextualHelp - Help box for specific sections
 */
export function ContextualHelp({
  title,
  content,
  tips = [],
  relatedLinks = [],
  level = 'info', // 'info', 'tip', 'warning'
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const levelConfig = {
    info: { icon: '💡', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-900' },
    tip: { icon: '⭐', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-900' },
    warning: { icon: '⚠️', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-900' },
  };

  const config = levelConfig[level] || levelConfig.info;

  return (
    <div className={`contextual-help ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
      <div className="help-header">
        <span className="help-level-icon">{config.icon}</span>
        <h4 className="help-title">{title}</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="help-toggle"
          aria-expanded={isExpanded}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="help-content">
          <p className="help-description">{content}</p>

          {tips.length > 0 && (
            <div className="help-tips">
              <strong>Quick Tips:</strong>
              <ul>
                {tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {relatedLinks.length > 0 && (
            <div className="help-links">
              <strong>Learn More:</strong>
              <ul>
                {relatedLinks.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PreEmptiveHelp - Help before user encounters problems
 */
export function PreEmptiveHelp({
  trigger,
  title,
  help,
  dismissible = true,
}) {
  const [isDismissed, setIsDismissed] = React.useState(() => {
    return localStorage.getItem(`help-dismissed-${trigger}`) === 'true';
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`help-dismissed-${trigger}`, 'true');
  };

  return (
    <div className="pre-emptive-help">
      <div className="help-box">
        <span className="help-badge">💡 Help</span>
        <h4 className="help-box-title">{title}</h4>
        <p className="help-box-content">{help}</p>

        {dismissible && (
          <button onClick={handleDismiss} className="help-dismiss">
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ProgressIndicator - Shows progress through a process
 */
export function ProgressIndicator({
  current,
  total,
  label,
  showPercentage = true,
  animated = true,
}) {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        {showPercentage && (
          <span className="progress-percentage">{Math.round(percentage)}%</span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${animated ? 'animated' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          <span className="progress-value">
            {current} of {total}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * OnboardingChecklist - Track completion of onboarding steps
 */
export function OnboardingChecklist({
  items,
  completed = [],
  onItemClick,
}) {
  return (
    <div className="onboarding-checklist">
      <h3 className="checklist-title">Your Setup Progress</h3>

      <div className="checklist-items">
        {items.map((item, idx) => {
          const isCompleted = completed.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => onItemClick && onItemClick(idx)}
              className={`checklist-item ${isCompleted ? 'completed' : ''}`}
            >
              <div className="checklist-checkbox">
                {isCompleted && <span className="checkmark">✓</span>}
              </div>

              <div className="checklist-content">
                <span className="checklist-label">{item.label}</span>
                {item.description && (
                  <span className="checklist-description">{item.description}</span>
                )}
              </div>

              {item.icon && <span className="checklist-icon">{item.icon}</span>}
            </button>
          );
        })}
      </div>

      <div className="checklist-stats">
        <div className="stat">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{completed.length}/{items.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Progress</span>
          <span className="stat-value">{Math.round((completed.length / items.length) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

export default {
  EmptyState,
  LoadingState,
  ErrorState,
  ContextualHelp,
  PreEmptiveHelp,
  ProgressIndicator,
  OnboardingChecklist,
};
