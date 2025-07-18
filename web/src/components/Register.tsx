import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormValidation, validationRules } from '../hooks/useFormValidation';
import InputField from './ui/InputField';
import Button from './ui/Button';
import Alert from './ui/Alert';

interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  options: { value: string; label: string }[];
  helperText?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  options,
  helperText,
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          appearance-none relative block w-full px-3 py-3 border rounded-lg
          text-gray-900 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-offset-0 focus:z-10
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          transition-colors duration-200
          ${error 
            ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
            : 'border-gray-300 hover:border-gray-400 focus:ring-primary-500 focus:border-primary-500'
          }
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-error-600 animate-slide-up flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'club', // Default to club since students use mobile app
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation({
    name: validationRules.name,
    email: validationRules.email,
    password: validationRules.password,
    confirmPassword: validationRules.confirmPassword(formData.password),
    role: { required: true },
  });

  useEffect(() => {
    // Clear success/error messages after 5 seconds
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    if (errors[name]) {
      clearError(name);
    }

    // Special case for password confirmation
    if (name === 'password' && formData.confirmPassword) {
      clearError('confirmPassword');
    }
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let fieldError;
    
    if (name === 'confirmPassword') {
      fieldError = validationRules.confirmPassword(formData.password).custom!(value);
    } else {
      fieldError = validateField(name, value);
    }
    
    if (fieldError) {
      setFieldError(name, fieldError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if terms are accepted
    if (!termsAccepted) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    // Update validation rules for confirmPassword with current password
    const updatedValidation = {
      ...formData,
      confirmPassword: formData.confirmPassword, // Ensure we're validating against current password
    };

    // Validate form
    if (!validateForm(updatedValidation)) {
      return;
    }

    // Additional password confirmation check
    if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      // This line won't be reached since register now throws a success message
    } catch (err: any) {
      const message = err.message || err.response?.data?.message || 'An error occurred during registration';
      
      // Check if it's actually a success message
      if (message.includes('Registration successful')) {
        setSuccess(message);
        // Clear the form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'club',
        });
        setTermsAccepted(false);
      } else {
        setError(message);
        
        // Set specific field errors based on error type
        if (message.includes('email')) {
          setFieldError('email', 'This email is already registered');
        } else if (message.includes('password')) {
          setFieldError('password', 'Password requirements not met');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'club', label: 'Club Administrator' },
    { value: 'admin', label: 'System Administrator' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center animate-fade-in">
          {/* Logo/Icon */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-primary-600 rounded-full shadow-lg mb-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Join KDU Student System
          </p>
          <p className="text-sm text-primary-600 font-medium">
            Administrator & Club Portal
          </p>
          <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-800">
              📱 <strong>Students:</strong> Please use the mobile app instead
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-large rounded-xl border border-gray-100 animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Global Error */}
            {error && (
              <Alert
                type="error"
                message={error}
                dismissible
                onDismiss={() => setError('')}
              />
            )}

            {/* Success Message */}
            {success && (
              <Alert
                type="success"
                title="Registration Successful!"
                message={success}
              />
            )}

            {/* Name Field */}
            <InputField
              id="name"
              name="name"
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              required
              disabled={isLoading}
              helperText="Your name will be displayed in the system"
            />

            {/* Email Field */}
            <InputField
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              required
              autoComplete="email"
              disabled={isLoading}
              helperText="You'll receive a verification email"
            />

            {/* Role Field */}
            <SelectField
              id="role"
              name="role"
              label="Role"
              value={formData.role}
              onChange={handleChange}
              error={errors.role}
              required
              disabled={isLoading}
              options={roleOptions}
              helperText="Students should use the mobile app instead"
            />

            {/* Password Field */}
            <InputField
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              required
              disabled={isLoading}
              helperText="Minimum 6 characters"
            />

            {/* Confirm Password Field */}
            <InputField
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              required
              disabled={isLoading}
            />

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
                <span className="text-error-500 ml-1">*</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              disabled={Object.keys(errors).length > 0 || !termsAccepted}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            {success && (
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Go to Login
                </Link>
              </div>
            )}

            {/* Divider */}
            {!success && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sign In Link */}
            {!success && (
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Sign in instead
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 KDU Student System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
