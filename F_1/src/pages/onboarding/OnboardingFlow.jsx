import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import OnboardingWizard from '../onboarding/OnboardingWizard';
import {
  WelcomeStep,
  AccountStep,
  ProfileStep,
  AddressStep,
  FarmStep,
  PreferencesStep,
  ReviewStep,
} from '../onboarding/OnboardingSteps';
import PageTransition from '../common/PageTransition';
import { useData } from '../../context/DataContext';
import './OnboardingFlow.css';

/**
 * OnboardingFlow - Main onboarding page
 * Guides new users through account setup based on their role
 */
export default function OnboardingFlow() {
  const { navigate } = useRouter();
  const { user, login } = useAuth();
  const { refreshAll } = useData();
  const [_loading, _setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Check if user already completed onboarding
  useEffect(() => {
    if (user?.onboardingCompleted) {
      // Navigate to role-based dashboard
      if (user.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (user.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); // Fallback to home
      }
    }
  }, [user, navigate]);

  // Build steps based on user role
  const buildSteps = () => {
    const commonSteps = [
      {
        id: 'welcome',
        label: 'Welcome',
        title: 'Welcome to FarmDirect',
        description: 'Choose your role to get started',
        component: WelcomeStep,
        validate: async (data) => {
          const errors = {};
          if (!data.role) {
            errors.role = 'Please select a role to continue';
          }
          return errors;
        },
      },
      {
        id: 'account',
        label: 'Account',
        title: 'Create Your Account',
        description: 'Set up your login credentials',
        component: AccountStep,
        validate: async (data) => {
          const errors = {};

          if (!stepData.fullName?.trim()) {
            errors.fullName = 'Full name is required';
          }

          if (!stepData.email?.trim()) {
            errors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stepData.email)) {
            errors.email = 'Please enter a valid email';
          }

          if (!stepData.phone?.trim()) {
            errors.phone = 'Phone number is required';
          }

          if (!stepData.password) {
            errors.password = 'Password is required';
          } else if (stepData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
          }

          if (stepData.password !== stepData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
          }

          return errors;
        },
      },
      {
        id: 'profile',
        label: 'Profile',
        title: 'Set Up Your Profile',
        description: 'Add a profile photo and bio',
        component: ProfileStep,
      },
    ];

    // Add buyer-specific steps
    if (data.role === 'buyer' || data.role === 'both') {
      commonSteps.splice(3, 0, {
        id: 'address',
        label: 'Address',
        title: 'Delivery Address',
        description: 'Tell us where to deliver',
        component: AddressStep,
        validate: async (data) => {
          const errors = {};
          if (!data.addressLine1?.trim()) {
            errors.addressLine1 = 'Address is required';
          }
          if (!data.city?.trim()) {
            errors.city = 'City is required';
          }
          if (!data.state?.trim()) {
            errors.state = 'State is required';
          }
          if (!data.postalCode?.trim()) {
            errors.postalCode = 'Postal code is required';
          }
          return errors;
        },
      });
    }

    // Add farmer-specific steps
    if (data.role === 'farmer' || data.role === 'both') {
      commonSteps.push({
        id: 'farm',
        label: 'Farm',
        title: 'Tell us About Your Farm',
        description: 'Share your farming details',
        component: FarmStep,
        validate: async (data) => {
          const errors = {};
          if (!data.farmName?.trim()) {
            errors.farmName = 'Farm name is required';
          }
          if (!data.farmLocation?.trim()) {
            errors.farmLocation = 'Farm location is required';
          }
          if (!data.farmExperience) {
            errors.farmExperience = 'Years of experience is required';
          }
          if (!data.cropTypes || data.cropTypes.length === 0) {
            errors.cropTypes = 'Please select at least one crop type';
          }
          return errors;
        },
      });
    }

    // Add remaining steps
    commonSteps.push(
      {
        id: 'preferences',
        label: 'Preferences',
        title: 'Your Preferences',
        description: 'Customize your experience',
        component: PreferencesStep,
        validate: async (data) => {
          const errors = {};
          if (!data.acceptTerms) {
            errors.acceptTerms = 'You must accept the terms to continue';
          }
          return errors;
        },
      },
      {
        id: 'review',
        label: 'Review',
        title: 'Review Your Information',
        description: 'Verify everything is correct',
        component: ReviewStep,
      }
    );

    return commonSteps;
  };

  const handleComplete = async (formData) => {
    _setLoading(true);
    setError(null);

    try {
      // Call API to complete onboarding
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Refresh user data and navigate to role-based dashboard
      await refreshAll();
      if (formData.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (formData.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (formData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); // Fallback to home
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      _setLoading(false);
    }
  };

  const handleSkip = (formData) => {
    console.log('Onboarding skipped with data:', formData);
    // Navigate to role-based dashboard
    if (formData.role === 'farmer') {
      navigate('/farmer/dashboard');
    } else if (formData.role === 'buyer') {
      navigate('/buyer/dashboard');
    } else if (formData.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/'); // Fallback to home
    }
  };

  if (!user) {
    return <PageTransition><div>Loading...</div></PageTransition>;
  }

  const steps = buildSteps();

  return (
    <div className="onboarding-flow">
      <OnboardingWizard
        steps={steps}
        onComplete={handleComplete}
        onSkip={handleSkip}
        allowSkip={true}
        autoSave={true}
        initialData={{
          role: userRole,
          receiveEmails: true,
          emailNotifications: true,
          pushNotifications: true,
          profilePublic: true,
        }}
      />

      {error && (
        <div className="onboarding-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
