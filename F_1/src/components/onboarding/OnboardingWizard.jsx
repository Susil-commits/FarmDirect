import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Circle } from 'lucide-react';
import Button from '../common/Button';
import PageTransition from '../common/PageTransition';
import './OnboardingWizard.css';

/**
 * OnboardingWizard - Multi-step wizard component
 * Features:
 * - Step-by-step progression with validation
 * - Progress tracking and visual indicators
 * - Smooth transitions between steps
 * - Custom step components
 * - Auto-save functionality
 * - Keyboard navigation support
 */
export default function OnboardingWizard({
  steps,
  onComplete,
  onSkip,
  initialData = {},
  showProgressBar = true,
  showStepIndicator = true,
  allowSkip = false,
  autoSave = true,
  saveInterval = 30000, // 30 seconds
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(new Array(steps.length).fill(false));

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave) return;
    
    const saveTimer = setInterval(() => {
      localStorage.setItem(`onboarding-draft-${steps[currentStep]?.id}`, JSON.stringify(formData));
    }, saveInterval);

    return () => clearInterval(saveTimer);
  }, [formData, currentStep, autoSave, saveInterval, steps]);

  // Validate current step
  const validateStep = useCallback(async () => {
    if (steps[currentStep]?.validate) {
      try {
        const stepErrors = await steps[currentStep].validate(formData);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          return false;
        }
      } catch (error) {
        console.error('Validation error:', error);
        return false;
      }
    }
    setErrors({});
    return true;
  }, [currentStep, formData, steps]);

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateStep();
    if (!isValid) return;

    const newCompleted = [...completed];
    newCompleted[currentStep] = true;
    setCompleted(newCompleted);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Wizard complete
      setLoading(true);
      try {
        if (onComplete) {
          await onComplete(formData);
        }
      } catch (error) {
        console.error('Completion error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (allowSkip && onSkip) {
      onSkip(formData);
    }
  };

  // Update form data
  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Jump to step
  const jumpToStep = (stepIndex) => {
    if (stepIndex < completed.length && completed[stepIndex]) {
      setCurrentStep(stepIndex);
    }
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <PageTransition>
      <div className="onboarding-wizard min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50">
        {/* Progress Bar */}
        {showProgressBar && (
          <div className="sticky top-0 z-40 bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {step?.title || 'Setup'}
                </h2>
                <span className="text-sm text-gray-600">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-green-500 to-emerald-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Step Indicator */}
          {showStepIndicator && (
            <div className="mb-12">
              <div className="flex items-center gap-2 overflow-x-auto pb-4">
                {steps.map((s, idx) => (
                  <div key={idx} className="flex items-center">
                    <button
                      onClick={() => jumpToStep(idx)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 min-w-fit cursor-pointer ${
                        idx === currentStep
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : idx < currentStep
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      disabled={idx > currentStep}
                    >
                      {idx < currentStep ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Circle size={18} />
                      )}
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className="w-2 h-1 bg-gray-300 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 min-h-96">
            {step?.component ? (
              <step.component
                data={formData}
                updateData={updateFormData}
                errors={errors}
                isActive={true}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Step not configured</p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                disabled={currentStep === 0 || loading}
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Previous
              </Button>

              {allowSkip && !isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  Skip
                </Button>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={loading}
              loading={loading}
              className="flex items-center gap-2"
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight size={18} />}
            </Button>
          </div>

          {/* Step Description */}
          {step?.description && (
            <p className="text-center text-gray-600 mt-6 text-sm">
              {step.description}
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
