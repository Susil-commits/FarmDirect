import React, { useState, useEffect } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { authServiceExtended } from '../../services/appService';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';
import {
  WelcomeStep,
  AccountStep,
  ProfileStep,
  AddressStep,
  FarmStep,
  PreferencesStep,
  ReviewStep,
} from '../../components/onboarding/OnboardingSteps';
import PageTransition from '../../components/common/PageTransition';
import { useData } from '../../hooks/useData';
import './OnboardingFlow.css';

export default function OnboardingFlow() {
  const { navigate } = useRouter();
  const { user, _login } = useAuth();
  const { refreshAll } = useData();
  const [_loading, _setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, _setUserRole] = useState(null);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      
      if (user.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (user.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); 
      }
    }
  }, [user, navigate]);

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

          if (!data.fullName?.trim()) {
            errors.fullName = 'Full name is required';
          }

          if (!data.email?.trim()) {
            errors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = 'Please enter a valid email';
          }

          if (!data.phone?.trim()) {
            errors.phone = 'Phone number is required';
          }

          if (!data.password) {
            errors.password = 'Password is required';
          } else if (data.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
          }

          if (data.password !== data.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
          }

          return errors;
        }
      },
      {
        id: 'profile',
        label: 'Profile',
        title: 'Set Up Your Profile',
        description: 'Add a profile photo and bio',
        component: ProfileStep,
      },
    ];

    const role = commonSteps[0]?.role || userRole;
    if (role === 'buyer' || role === 'both') {
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

    if (role === 'farmer' || role === 'both') {
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
      
      await authServiceExtended.completeOnboarding(formData);

      await refreshAll();
      if (formData.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (formData.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (formData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/'); 
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      _setLoading(false);
    }
  };

  const handleSkip = (formData) => {
    
    if (formData.role === 'farmer') {
      navigate('/farmer/dashboard');
    } else if (formData.role === 'buyer') {
      navigate('/buyer/dashboard');
    } else if (formData.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/'); 
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
