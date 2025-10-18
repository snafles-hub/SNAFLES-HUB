import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PrivacyPolicyModal from '../modals/PrivacyPolicyModal';
import TermsOfServiceModal from '../modals/TermsOfServiceModal';

const LoginModal = ({ isOpen, onClose, redirectTo = '/' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Password strength checks for registration
  const passwordRules = (() => {
    const p = formData.password || '';
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /\d/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  })();
  const isStrongPassword = Object.values(passwordRules).every(Boolean);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'email' && emailError) {
      setEmailError('');
    }
  };

  // Third-party OAuth removed: only email/password auth

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user agreed to terms (only for registration)
    if (!isLogin && !agreedToTerms) {
      toast.error('Please agree to our Terms of Service and Privacy Policy');
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
          onClose();
          navigate(redirectTo);
        } else {
          toast.error(result.message);
        }
      } else {
        // Enforce strong password on registration
        if (!isStrongPassword) {
          toast.error('Password must meet all strength requirements');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        const result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          const firstName = (result.user?.name || 'there').split(' ')[0];
          toast.success(`Account created! Welcome, ${firstName}!`);
          onClose();
          navigate(redirectTo);
        } else {
          if (/already exists/i.test(result.message || '')) {
            setEmailError('An account with this email already exists. Please sign in.');
          }
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your full name"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`input pl-10 ${!isLogin && emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your email"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            {!isLogin && emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="input pl-10 pr-10"
                placeholder="Enter your password"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Password strength helper - only for registration */}
            {!isLogin && (
              <div className="mt-2 text-xs">
                <p className="text-gray-700 font-medium">Password must contain:</p>
                <ul className="mt-1 space-y-1">
                  <li className={passwordRules.length ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRules.length ? '✓' : '•'} At least 8 characters
                  </li>
                  <li className={passwordRules.upper ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRules.upper ? '✓' : '•'} An uppercase letter (A-Z)
                  </li>
                  <li className={passwordRules.lower ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRules.lower ? '✓' : '•'} A lowercase letter (a-z)
                  </li>
                  <li className={passwordRules.number ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRules.number ? '✓' : '•'} A number (0-9)
                  </li>
                  <li className={passwordRules.special ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRules.special ? '✓' : '•'} A special character (!@#$...)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Confirm your password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
          )}

          {/* User Agreement Checkbox - Only show for registration */}
          {!isLogin && (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreedToTerms 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {agreedToTerms && <Check size={12} />}
                </button>
                <div className="text-sm text-gray-600">
                  <p>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsOfService(true)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyPolicy(true)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && (!agreedToTerms || !isStrongPassword))}
            className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {/* Third-party auth removed */}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicy} 
        onClose={() => setShowPrivacyPolicy(false)} 
      />

      {/* Terms of Service Modal */}
      <TermsOfServiceModal 
        isOpen={showTermsOfService} 
        onClose={() => setShowTermsOfService(false)} 
      />
    </div>
  );
};

export default LoginModal;
