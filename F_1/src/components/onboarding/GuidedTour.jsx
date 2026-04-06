import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import Button from '../common/Button';
import './GuidedTour.css';

/**
 * GuidedTour - Interactive step-by-step tour
 * Features:
 * - Highlight specific elements
 * - Show contextual tooltips
 * - Progress tracking
 * - Keyboard navigation
 * - Skip option
 * - Completion tracking
 */
export function GuidedTour({ steps, onComplete, onSkip, startOnMount = false }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(startOnMount);
  const [completed, setCompleted] = useState(false);
  const [highlightRect, setHighlightRect] = useState(null);
  const tourRef = useRef(null);

  useEffect(() => {
    if (!isActive || !steps[currentStepIndex]) return;

    const timer = setTimeout(() => {
      updateHighlight();
    }, 100);

    window.addEventListener('resize', updateHighlight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [currentStepIndex, isActive, steps]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, steps]);

  const updateHighlight = () => {
    const step = steps[currentStepIndex];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (!element) {
      setHighlightRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setHighlightRect({
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    });
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
    setIsActive(false);
    if (onComplete) onComplete();
    localStorage.setItem('tour-completed', 'true');
  };

  const handleSkip = () => {
    setIsActive(false);
    if (onSkip) onSkip();
  };

  if (!isActive || !steps[currentStepIndex]) return null;

  const step = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <>
      {/* Highlight overlay */}
      <div className="guided-tour-overlay" onClick={handleSkip}>
        {highlightRect && (
          <>
            <div
              className="guided-tour-highlight-box"
              style={{
                top: `${highlightRect.top}px`,
                left: `${highlightRect.left}px`,
                width: `${highlightRect.width}px`,
                height: `${highlightRect.height}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="guided-tour-pulse" style={{
              top: `${highlightRect.top + highlightRect.height / 2}px`,
              left: `${highlightRect.left + highlightRect.width / 2}px`,
            }} />
          </>
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tourRef}
        className="guided-tour-tooltip"
        style={{
          top: highlightRect ? `${highlightRect.top + highlightRect.height + 20}px` : '50%',
          left: highlightRect ? `${highlightRect.left}px` : '50%',
          transform: highlightRect ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          minWidth: highlightRect ? 'auto' : '400px',
        }}
      >
        <div className="tooltip-arrow" />

        <div className="tooltip-header">
          <Lightbulb size={18} className="tooltip-icon" />
          <span className="tooltip-title">{step.title}</span>
          <button
            onClick={handleSkip}
            className="tooltip-close"
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
        </div>

        <p className="tooltip-description">{step.description}</p>

        {step.action && (
          <div className="tooltip-action">
            {step.action}
          </div>
        )}

        <div className="tooltip-footer">
          <div className="progress-indicator">
            <span className="progress-text">
              {currentStepIndex + 1} of {steps.length}
            </span>
            <div className="progress-dots">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`dot ${idx === currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="tooltip-buttons">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentStepIndex === 0}
              onClick={handlePrevious}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Back
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="flex items-center gap-1"
            >
              {currentStepIndex === steps.length - 1 ? 'Done' : 'Next'}
              {currentStepIndex < steps.length - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * TourTrigger - Button to start a tour
 */
export function TourTrigger({ label = 'Take a tour', tourId, onStart }) {
  const [showTour, setShowTour] = useState(false);

  const handleStart = () => {
    setShowTour(true);
    if (onStart) onStart();
  };

  return (
    <button
      onClick={handleStart}
      className="tour-trigger"
      aria-label={label}
    >
      <Lightbulb size={18} />
      {label}
    </button>
  );
}

/**
 * Tooltip - Contextual help tooltip
 */
export function Tooltip({ label, content, position = 'top', trigger = 'hover' }) {
  const [isVisible, setIsVisible] = useState(trigger === 'click' ? false : false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (trigger !== 'hover') return;

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    const element = tooltipRef.current;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [trigger]);

  return (
    <div ref={tooltipRef} className={`tooltip-wrapper ${position}`}>
      <button
        className="tooltip-trigger"
        onClick={() => trigger === 'click' && setIsVisible(!isVisible)}
        aria-label="More info"
      >
        <Lightbulb size={16} />
      </button>

      {isVisible && (
        <div className={`tooltip-content tooltip-${position}`}>
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * HelpHint - Inline help hint
 */
export function HelpHint({ children, icon: Icon = Lightbulb }) {
  return (
    <div className="help-hint">
      <Icon size={16} className="hint-icon" />
      <span className="hint-text">{children}</span>
    </div>
  );
}

export default { GuidedTour, TourTrigger, Tooltip, HelpHint };
