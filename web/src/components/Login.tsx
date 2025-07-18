import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormValidation, validationRules } from '../hooks/useFormValidation';
import InputField from './ui/InputField';
import Button from './ui/Button';
import Alert from './ui/Alert';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();

  const { errors, validateField, validateForm, clearError, setError: setFieldError } = useFormValidation({
    email: validationRules.email,
    password: { required: true },
  });

  useEffect(() => {
    // Clear errors when user starts typing
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    if (errors[name]) {
      clearError(name);
    }
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    if (fieldError) {
      setFieldError(name, fieldError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    setResendMessage('');

    // Validate form
    if (!validateForm(formData)) {
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'An error occurred during login';
      setError(errorMessage);
      
      // Check if it's an email verification error
      if (err.response?.data?.requiresEmailVerification || errorMessage.includes('verify your email')) {
        setShowResendVerification(true);
      }

      // Set specific field errors based on error type
      if (errorMessage.includes('email')) {
        setFieldError('email', 'Invalid email address');
      } else if (errorMessage.includes('password')) {
        setFieldError('password', 'Invalid password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setResendMessage('Please enter your email address first.');
      return;
    }

    if (errors.email) {
      setResendMessage('Please enter a valid email address.');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const result = await resendVerification(formData.email);
      if (result.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
      } else {
        setResendMessage(result.message);
      }
    } catch (err: any) {
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center animate-fade-in">
          {/* Logo/Icon */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-primary-600 rounded-full shadow-lg mb-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Administrator & Club Portal
          </p>
          <p className="text-sm text-primary-600 font-medium">
            KDU Student System - Web Application
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

            {/* Email Verification Alert */}
            {showResendVerification && (
              <Alert
                type="warning"
                title="Email Verification Required"
                message="Your email address needs to be verified before you can log in."
              />
            )}

            {/* Resend Message */}
            {resendMessage && (
              <Alert
                type={resendMessage.includes('sent') ? 'success' : 'error'}
                message={resendMessage}
                dismissible
                onDismiss={() => setResendMessage('')}
              />
            )}

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
              autoComplete="current-password"
              disabled={isLoading}
            />

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Email Verification Button */}
            {showResendVerification && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleResendVerification}
                loading={resendLoading}
                fullWidth
                className="mb-4"
              >
                Resend Verification Email
              </Button>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              disabled={Object.keys(errors).length > 0}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to KDU Student System?</span>
                </div>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                to="/register"
                className="inline-flex items-center font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Create your account
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
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

export default Login;
