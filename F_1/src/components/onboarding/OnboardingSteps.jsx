import React, { useState } from 'react';
import { Mail, Lock, User, MapPin, Phone, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { HelpHint } from './GuidedTour';
import '../onboarding/OnboardingSteps.css';

/**
 * Welcome Step - Introduce the onboarding process
 */
export function WelcomeStep({ data, updateData, errors }) {
  const [selectedRole, setSelectedRole] = useState(data.role || null);

  const roles = [
    {
      id: 'buyer',
      label: 'I want to Buy',
      description: 'Browse fresh produce from local farmers',
      icon: '🛒',
    },
    {
      id: 'farmer',
      label: 'I want to Sell',
      description: 'Reach customers directly and grow your farm',
      icon: '🌾',
    },
    {
      id: 'both',
      label: 'Both Buyer & Seller',
      description: 'Get the complete FarmDirect experience',
      icon: '🔄',
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    updateData({ role: roleId });
  };

  return (
    <div className="onboarding-step welcome-step">
      <div className="step-header">
        <h2>Welcome to FarmDirect! 🌱</h2>
        <p>Let's get you set up in just a few steps</p>
      </div>

      <div className="role-selector">
        <p className="role-label">What would you like to do?</p>
        <div className="roles-grid">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
            >
              <span className="role-icon">{role.icon}</span>
              <span className="role-title">{role.label}</span>
              <span className="role-description">{role.description}</span>
              {selectedRole === role.id && (
                <CheckCircle2 size={20} className="role-checkmark" />
              )}
            </button>
          ))}
        </div>
      </div>

      <HelpHint>
        You can change this anytime in your profile settings
      </HelpHint>

      {errors.role && (
        <div className="step-error">
          <AlertCircle size={16} />
          {errors.role}
        </div>
      )}
    </div>
  );
}

/**
 * Account Step - Create account
 */
export function AccountStep({ data, updateData, errors }) {
  const handleChange = (field, value) => {
    updateData({ [field]: value });
  };

  return (
    <div className="onboarding-step account-step">
      <div className="step-header">
        <h2>Create Your Account 🔐</h2>
        <p>This helps us secure your account</p>
      </div>

      <form className="step-form">
        <div className="form-group">
          <label>Full Name</label>
          <Input
            type="text"
            placeholder="Enter your full name"
            value={data.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            error={errors.fullName}
            icon={User}
          />
          <HelpHint>Use your real name for better trust and reviews</HelpHint>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            icon={Mail}
          />
          <HelpHint>We'll send verification email here</HelpHint>
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <Input
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            icon={Phone}
          />
          <HelpHint>For delivery updates and order notifications</HelpHint>
        </div>

        <div className="form-group">
          <label>Password</label>
          <Input
            type="password"
            placeholder="Create a strong password"
            value={data.password || ''}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            icon={Lock}
          />
          <p className="password-hint">
            Use at least 8 characters with upper, lower, numbers and symbols
          </p>
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <Input
            type="password"
            placeholder="Re-enter your password"
            value={data.confirmPassword || ''}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            icon={Lock}
          />
        </div>
      </form>

      {errors.general && (
        <div className="step-error">
          <AlertCircle size={16} />
          {errors.general}
        </div>
      )}
    </div>
  );
}

/**
 * Profile Step - Complete profile
 */
export function ProfileStep({ data, updateData, errors }) {
  const handleChange = (field, value) => {
    updateData({ [field]: value });
  };

  return (
    <div className="onboarding-step profile-step">
      <div className="step-header">
        <h2>Set Up Your Profile 👤</h2>
        <p>Help other users know more about you</p>
      </div>

      <form className="step-form">
        <div className="form-group">
          <label>Profile Photo</label>
          <div className="photo-upload">
            <input
              type="file"
              accept="image/*"
              className="photo-input"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    updateData({ profilePhoto: event.target.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div className="photo-placeholder">
              {data.profilePhoto ? (
                <img src={data.profilePhoto} alt="Profile" />
              ) : (
                <User size={48} />
              )}
            </div>
            <span>Click to upload or drag and drop</span>
          </div>
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            placeholder="Tell us about yourself (optional)"
            value={data.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="textarea"
            rows="4"
          />
          <span className="char-count">
            {(data.bio || '').length}/500 characters
          </span>
        </div>

        <div className="form-group">
          <label>Location</label>
          <Input
            type="text"
            placeholder="City, State"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            error={errors.location}
            icon={MapPin}
          />
        </div>

        <div className="preferences">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.receiveEmails || false}
              onChange={(e) => handleChange('receiveEmails', e.target.checked)}
            />
            <span>Receive emails about updates and promotions</span>
          </label>
        </div>
      </form>
    </div>
  );
}

/**
 * Address Step - For buyers (delivery address)
 */
export function AddressStep({ data, updateData, errors }) {
  const handleChange = (field, value) => {
    updateData({ [field]: value });
  };

  return (
    <div className="onboarding-step address-step">
      <div className="step-header">
        <h2>Delivery Address 📍</h2>
        <p>Where should we deliver your fresh produce?</p>
      </div>

      <form className="step-form">
        <div className="form-group">
          <label>House / Flat Number</label>
          <Input
            type="text"
            placeholder="e.g., 123 or Block A"
            value={data.addressLine1 || ''}
            onChange={(e) => handleChange('addressLine1', e.target.value)}
            error={errors.addressLine1}
          />
        </div>

        <div className="form-group">
          <label>Street Address</label>
          <Input
            type="text"
            placeholder="e.g., Main Street, Apartment Lane"
            value={data.addressLine2 || ''}
            onChange={(e) => handleChange('addressLine2', e.target.value)}
            error={errors.addressLine2}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <Input
              type="text"
              placeholder="City"
              value={data.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              error={errors.city}
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <Input
              type="text"
              placeholder="State"
              value={data.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              error={errors.state}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Postal Code</label>
          <Input
            type="text"
            placeholder="000000"
            value={data.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            error={errors.postalCode}
          />
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={data.setDefault || false}
            onChange={(e) => handleChange('setDefault', e.target.checked)}
          />
          <span>Set as default delivery address</span>
        </label>
      </form>
    </div>
  );
}

/**
 * Farm Step - For farmers
 */
export function FarmStep({ data, updateData, errors }) {
  const handleChange = (field, value) => {
    updateData({ [field]: value });
  };

  const cropTypes = [
    '🥬 Vegetables',
    '🍎 Fruits',
    '🌾 Grains',
    '🥜 Pulses',
    '🧅 Spices',
    '🥛 Dairy',
    '🍯 Honey',
    '🌻 Organic',
    'Other',
  ];

  return (
    <div className="onboarding-step farm-step">
      <div className="step-header">
        <h2>Tell us About Your Farm 🌾</h2>
        <p>Help buyers understand what you offer</p>
      </div>

      <form className="step-form">
        <div className="form-group">
          <label>Farm Name</label>
          <Input
            type="text"
            placeholder="Your farm's name"
            value={data.farmName || ''}
            onChange={(e) => handleChange('farmName', e.target.value)}
            error={errors.farmName}
            icon={Building2}
          />
        </div>

        <div className="form-group">
          <label>Farm Location</label>
          <Input
            type="text"
            placeholder="City, District"
            value={data.farmLocation || ''}
            onChange={(e) => handleChange('farmLocation', e.target.value)}
            error={errors.farmLocation}
            icon={MapPin}
          />
        </div>

        <div className="form-group">
          <label>Years of Experience</label>
          <Input
            type="number"
            placeholder="e.g., 5"
            min="0"
            value={data.farmExperience || ''}
            onChange={(e) => handleChange('farmExperience', e.target.value)}
            error={errors.farmExperience}
          />
        </div>

        <div className="form-group">
          <label>What do you grow?</label>
          <div className="crop-selector">
            {cropTypes.map((crop) => (
              <label key={crop} className="crop-chip">
                <input
                  type="checkbox"
                  checked={(data.cropTypes || []).includes(crop)}
                  onChange={(e) => {
                    const current = data.cropTypes || [];
                    if (e.target.checked) {
                      updateData({ cropTypes: [...current, crop] });
                    } else {
                      updateData({ cropTypes: current.filter((c) => c !== crop) });
                    }
                  }}
                />
                <span>{crop}</span>
              </label>
            ))}
          </div>
          {errors.cropTypes && (
            <span className="error">{errors.cropTypes}</span>
          )}
        </div>

        <div className="form-group">
          <label>Farm Description</label>
          <textarea
            placeholder="Tell customers about your farming practices, specialties, etc."
            value={data.farmDescription || ''}
            onChange={(e) => handleChange('farmDescription', e.target.value)}
            className="textarea"
            rows="4"
          />
        </div>
      </form>
    </div>
  );
}

/**
 * Preferences Step - User preferences
 */
export function PreferencesStep({ data, updateData, errors }) {
  const handleChange = (field, value) => {
    updateData({ [field]: value });
  };

  return (
    <div className="onboarding-step preferences-step">
      <div className="step-header">
        <h2>Your Preferences ⚙️</h2>
        <p>Customize your FarmDirect experience</p>
      </div>

      <div className="preferences-form">
        <div className="preference-section">
          <h3>Notifications</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.emailNotifications !== false}
              onChange={(e) =>
                handleChange('emailNotifications', e.target.checked)
              }
            />
            <span>Email notifications for orders and updates</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.pushNotifications !== false}
              onChange={(e) =>
                handleChange('pushNotifications', e.target.checked)
              }
            />
            <span>Push notifications (browser/app)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.smsNotifications || false}
              onChange={(e) => handleChange('smsNotifications', e.target.checked)}
            />
            <span>SMS notifications for urgent updates</span>
          </label>
        </div>

        <div className="preference-section">
          <h3>Privacy</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.profilePublic !== false}
              onChange={(e) => handleChange('profilePublic', e.target.checked)}
            />
            <span>Make my profile public (visible to all users)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.shareActivity || false}
              onChange={(e) => handleChange('shareActivity', e.target.checked)}
            />
            <span>Allow sharing my activity with others</span>
          </label>
        </div>

        <div className="preference-section">
          <h3>Marketing</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.marketingEmails || false}
              onChange={(e) => handleChange('marketingEmails', e.target.checked)}
            />
            <span>I'd like to receive special offers and promotions</span>
          </label>
        </div>

        <div className="preference-section">
          <label className="terms-label">
            <input
              type="checkbox"
              checked={data.acceptTerms || false}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              required
            />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.acceptTerms && (
            <div className="step-error">
              <AlertCircle size={16} />
              {errors.acceptTerms}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Review Step - Review all information
 */
export function ReviewStep({ data, errors }) {
  return (
    <div className="onboarding-step review-step">
      <div className="step-header">
        <h2>Review Your Information ✓</h2>
        <p>Make sure everything looks good</p>
      </div>

      <div className="review-sections">
        <div className="review-section">
          <h3>Role</h3>
          <p>{data.role}</p>
        </div>

        <div className="review-section">
          <h3>Account Info</h3>
          <p>
            <strong>{data.fullName}</strong>
          </p>
          <p>{data.email}</p>
          <p>{data.phone}</p>
        </div>

        {data.location && (
          <div className="review-section">
            <h3>Profile Location</h3>
            <p>{data.location}</p>
          </div>
        )}

        {data.addressLine1 && (
          <div className="review-section">
            <h3>Delivery Address</h3>
            <p>{data.addressLine1}</p>
            <p>{data.addressLine2}</p>
            <p>
              {data.city}, {data.state} {data.postalCode}
            </p>
          </div>
        )}

        {data.farmName && (
          <div className="review-section">
            <h3>Farm Info</h3>
            <p>
              <strong>{data.farmName}</strong>
            </p>
            <p>{data.farmLocation}</p>
            <p>Experience: {data.farmExperience} years</p>
          </div>
        )}
      </div>

      <div className="review-notice">
        <CheckCircle2 size={20} />
        <p>All set! Click "Complete" to finish your setup.</p>
      </div>
    </div>
  );
}

export default {
  WelcomeStep,
  AccountStep,
  ProfileStep,
  AddressStep,
  FarmStep,
  PreferencesStep,
  ReviewStep,
};
