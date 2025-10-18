import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import PrivacyPolicyModal from '../components/modals/PrivacyPolicyModal'
import TermsOfServiceModal from '../components/modals/TermsOfServiceModal'
import Logo from '../components/common/Logo'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Determine post-auth redirect target
  const getPostAuthRedirect = () => {
    const stored = localStorage.getItem('redirectAfterLogin')
    const fallback = location.state?.from?.pathname || '/'
    // Disallow redirecting back to auth screens
    const disallowed = new Set([
      '/login',
      '/vendor-login',
      '/admin-login',
      '/register',
      '/forgot-password',
    ])
    const target = (stored && !disallowed.has(stored)) ? stored : fallback
    // Clean up once read
    if (stored) localStorage.removeItem('redirectAfterLogin')
    return target || '/'
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  })

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Password strength checks for registration
  const passwordRules = (() => {
    const p = formData.password || ''
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /\d/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    }
  })()
  const isStrongPassword = Object.values(passwordRules).every(Boolean)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (e.target.name === 'email' && emailError) {
      setEmailError('')
    }
  }

  // Google OAuth removed: only email/password auth

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user agreed to terms (only for registration)
    if (!isLogin && !agreedToTerms) {
      toast.error('Please agree to our Terms of Service and Privacy Policy')
      return
    }
    
    setLoading(true)

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password)
        if (result.success) {
          toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`)
          // Prefer redirect target stored by guards; else home
          const dest = getPostAuthRedirect()
          navigate(dest, { replace: true })
        } else {
          toast.error(result.message)
        }
      } else {
        // Enforce strong password on registration
        if (!isStrongPassword) {
          toast.error('Password must meet all strength requirements')
          setLoading(false)
          return
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }

        const result = await register(formData)
        if (result.success) {
          const firstName = (result.user?.name || 'there').split(' ')[0]
          toast.success(`Account created! Welcome, ${firstName}!`)
          const dest = getPostAuthRedirect()
          navigate(dest, { replace: true })
        } else {
          // Show a clear field-level hint if email already exists
          if (/already exists/i.test(result.message || '')) {
            setEmailError('An account with this email already exists. Please sign in.')
          }
          toast.error(result.message)
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setFormData({
      ...formData,
      email: 'demo@snafles.com',
      password: 'demo123'
    })
  }

  const fillTestCredentials = () => {
    setFormData({
      ...formData,
      email: 'testexample@gmail.com',
      password: '123'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Logo size="large" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? 'Sign in to your account to continue' : 'Join our community of artisans and customers'}
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Credentials</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Demo Account:</span>
              <button
                onClick={fillDemoCredentials}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Use Demo Account
              </button>
            </div>
            <div className="text-blue-600 font-mono text-xs">
              demo@snafles.com / demo123
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Test Account:</span>
              <button
                onClick={fillTestCredentials}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Use Test Account
              </button>
            </div>
            <div className="text-blue-600 font-mono text-xs">
              testexample@gmail.com / 123
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
                <div className="mt-1 relative">
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
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
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

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your phone number"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your address"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange}
                      className="input"
                      placeholder="State"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

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

          <div>
            <button
              type="submit"
              disabled={loading || (!isLogin && (!agreedToTerms || !isStrongPassword))}
              className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          {/* Third-party auth removed */}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          By continuing, you agree to our{' '}
          <button 
            onClick={() => setShowTermsOfService(true)}
            className="text-primary hover:underline"
          >
            Terms of Service
          </button>
          {' '}and{' '}
          <button 
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-primary hover:underline"
          >
            Privacy Policy
          </button>
        </div>
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
  )
}

export default Login
