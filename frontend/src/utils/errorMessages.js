export const errorMessages = {
  'network-offline': {
    title: 'You are offline',
    message: 'Check your internet connection and try again.',
    variant: 'error',
    icon: 'WifiOff',
  },
  'invalid-password': {
    title: 'Incorrect password',
    message: 'Double‑check your password or reset it.',
    variant: 'error',
    icon: 'Lock',
  },
  'account-not-found': {
    title: 'Account not found',
    message: "We couldn't find an account with that email.",
    variant: 'error',
    icon: 'UserX',
  },
  'out-of-stock': {
    title: 'Out of stock',
    message: 'Sorry, this item is currently unavailable.',
    variant: 'warning',
    icon: 'Package',
  },
  'payment-failed': {
    title: 'Payment failed',
    message: 'Please try a different method or try again later.',
    variant: 'error',
    icon: 'CreditCard',
  },

  // Vendor
  'vendor-login-failed': {
    title: 'Vendor Login Failed',
    message: 'Invalid credentials or insufficient permissions.',
    variant: 'error',
    icon: 'Lock',
  },
  'vendor-suspended': {
    title: 'Vendor Account Suspended',
    message: 'Please contact support to restore access to your account.',
    variant: 'error',
    icon: 'Shield',
  },
  'product-create-success': {
    title: 'Product Creation Success',
    message: 'Your product has been created successfully.',
    variant: 'success',
    icon: 'CheckCircle',
  },
  'product-update-failed': {
    title: 'Product Update Failed',
    message: 'Could not save your changes. Please try again.',
    variant: 'error',
    icon: 'AlertCircle',
  },
  'image-upload-error': {
    title: 'Image Upload Error',
    message: 'Upload failed. Please try a different file or smaller size.',
    variant: 'error',
    icon: 'AlertCircle',
  },
  'inventory-low': {
    title: 'Inventory Low',
    message: 'This product is running low on stock.',
    variant: 'warning',
    icon: 'AlertTriangle',
  },

  // Admin
  'admin-access-denied': {
    title: 'Admin Access Denied',
    message: 'You do not have permission to view this page.',
    variant: 'error',
    icon: 'Shield',
  },
  'admin-login-required': {
    title: 'Admin Login Required',
    message: 'Please sign in with an administrator account.',
    variant: 'warning',
    icon: 'Lock',
  },
  'dashboard-load-failed': {
    title: 'Dashboard Data Load Failed',
    message: 'We could not load the latest dashboard data. Please retry.',
    variant: 'error',
    icon: 'AlertTriangle',
  },
  'user-suspension-success': {
    title: 'User Suspension Success',
    message: 'The user has been suspended.',
    variant: 'success',
    icon: 'CheckCircle',
  },
  'settings-save-failed': {
    title: 'Settings Save Failed',
    message: 'We couldn\'t save your settings. Please try again.',
    variant: 'error',
    icon: 'AlertCircle',
  },
}

// Basic classifier helpers
export function classifyAuthError(raw = '') {
  const msg = String(raw || '').toLowerCase()
  if (!msg) return null
  if (msg.includes('password')) return 'invalid-password'
  if (msg.includes('no user') || msg.includes('not found') || msg.includes('no account')) return 'account-not-found'
  return null
}
