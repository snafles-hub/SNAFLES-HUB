import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength checks
  const passwordRules = (() => {
    const p = password || '';
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /\d/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  })();
  const isStrongPassword = Object.values(passwordRules).every(Boolean);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword) {
      toast.error('Password must meet all strength requirements');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Password updated. You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">Enter your new password below.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="********"
            />
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
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !isStrongPassword}
            aria-busy={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

