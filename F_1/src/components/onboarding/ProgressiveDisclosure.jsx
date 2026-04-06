import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, HelpCircle, Zap } from 'lucide-react';
import './ProgressiveDisclosure.css';

/**
 * ProgressiveDisclosure - Reveal content gradually
 * Helps reduce cognitive load by showing only relevant information
 */
export function ProgressiveDisclosure({ title, children, defaultOpen = false, level = 0 }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(isOpen ? contentRef.current.scrollHeight + 20 : 0);
    }
  }, [isOpen]);

  return (
    <div className="progressive-disclosure" style={{ '--level': level }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`disclosure-header ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
      >
        <ChevronDown size={20} className="disclosure-icon" />
        <span className="disclosure-title">{title}</span>
      </button>
      
      <div
        ref={contentRef}
        className="disclosure-content"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <div className="disclosure-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * ConditionalFields - Show/hide fields based on conditions
 * Implements smart progressive disclosure for forms
 */
export function ConditionalFields({ condition, children, label, hint }) {
  const [isVisible, setIsVisible] = useState(condition);

  useEffect(() => {
    setIsVisible(condition);
  }, [condition]);

  if (!isVisible) return null;

  return (
    <div className="conditional-fields-wrapper" style={{ animation: 'slideDown 0.3s ease-out' }}>
      {label && (
        <div className="conditional-label">
          <span>{label}</span>
          {hint && (
            <div className="conditional-hint">
              <HelpCircle size={16} />
              <span>{hint}</span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * CollapsibleSection - Group related content with expand/collapse
 */
export function CollapsibleSection({
  title,
  children,
  icon: Icon,
  badge,
  defaultOpen = false,
  highlightNew = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section ${highlightNew ? 'new' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header"
        aria-expanded={isOpen}
      >
        <div className="header-content">
          {Icon && <Icon size={20} />}
          <span className="header-title">{title}</span>
          {badge && <span className="section-badge">{badge}</span>}
        </div>
        <ChevronDown
          size={20}
          className={`header-icon ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * SmartReveal - Progressively reveal content with interaction
 * Tracks user engagement before showing advanced options
 */
export function SmartReveal({ basicContent, advancedContent, revealLabel = 'Show more options' }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="smart-reveal">
      <div className="basic-content">
        {basicContent}
      </div>

      {!showAdvanced && (
        <button
          onClick={() => setShowAdvanced(true)}
          className="reveal-trigger"
        >
          <Zap size={16} />
          {revealLabel}
        </button>
      )}

      {showAdvanced && (
        <div className="advanced-content" style={{ animation: 'expandContent 0.3s ease-out' }}>
          {advancedContent}
        </div>
      )}
    </div>
  );
}

/**
 * ExpandableField - Individual field with expand functionality
 */
export function ExpandableField({
  label,
  description,
  children,
  defaultExpanded = false,
  error,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`expandable-field ${error ? 'error' : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="field-header"
      >
        <div className="field-label-container">
          <span className="field-label">{label}</span>
          {description && (
            <span className="field-description">{description}</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`field-icon ${isExpanded ? 'open' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="field-content" style={{ animation: 'slideDown 0.2s ease-out' }}>
          {children}
        </div>
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default { ProgressiveDisclosure, ConditionalFields, CollapsibleSection, SmartReveal, ExpandableField };
