import toast from 'react-hot-toast'
import React from 'react'
import ErrorAlert from '../components/common/ErrorAlert'
import { errorMessages, classifyAuthError } from './errorMessages'
import {
  AlertCircle,
  WifiOff,
  Lock,
  User,
  CreditCard,
  Package,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'

const iconMap = {
  AlertCircle,
  WifiOff,
  Lock,
  CreditCard,
  Package,
  Shield,
  CheckCircle,
  AlertTriangle,
  User,
} 

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

export function showError(keyOrMessage, opts = {}) {
  const { fallback } = opts
  let cfg = null

  if (errorMessages[keyOrMessage]) {
    cfg = errorMessages[keyOrMessage]
  } else if (isOffline()) {
    cfg = errorMessages['network-offline']
  } else {
    cfg = {
      title: 'Something went wrong',
      message: keyOrMessage || fallback || 'Please try again.',
      variant: 'error',
      icon: 'AlertCircle',
    }
  }

  const Icon = iconMap[cfg.icon] || AlertCircle

  return toast.custom(
    (t) => (
      <div className={`${t.visible ? 'animate-fade-in' : 'opacity-0'} max-w-md w-[28rem]`}> 
        <ErrorAlert title={cfg.title} message={cfg.message} icon={Icon} variant={cfg.variant} />
      </div>
    ),
    { duration: 3500, position: 'top-right' }
  )
}

export function showKey(key, overrides = {}) {
  const base = errorMessages[key] || { title: 'Notice', message: '', variant: 'info', icon: 'AlertCircle' }
  const cfg = { ...base, ...overrides }
  const Icon = iconMap[cfg.icon] || AlertCircle
  return toast.custom(
    () => (
      <div className="max-w-md w-[28rem]">
        <ErrorAlert title={cfg.title} message={cfg.message} icon={Icon} variant={cfg.variant} />
      </div>
    ),
    { duration: 3500, position: 'top-right' }
  )
}

export function showAuthError(rawMessage) {
  const key = classifyAuthError(rawMessage) || 'AlertCircle'
  if (key === 'invalid-password') {
    showError('invalid-password')
    return 'invalid-password'
  }
  if (key === 'account-not-found') {
    showError('account-not-found')
    return 'account-not-found'
  }
  // Fallback to raw
  showError(rawMessage)
  return 'generic'
}

export function showOutOfStock() {
  return showError('out-of-stock')
}

export function showPaymentFailed(rawMessage) {
  return showError('payment-failed', { fallback: rawMessage })
}

// Vendor helpers
export const showVendorLoginFailed = () => showKey('vendor-login-failed')
export const showVendorSuspended = () => showKey('vendor-suspended')
export const showProductCreateSuccess = (name) =>
  showKey('product-create-success', name ? { message: `Product "${name}" created successfully.` } : {})
export const showProductUpdateFailed = (msg) =>
  showKey('product-update-failed', msg ? { message: msg } : {})
export const showImageUploadError = (msg) =>
  showKey('image-upload-error', msg ? { message: msg } : {})
export const showInventoryLowAlert = (name, remaining) =>
  showKey('inventory-low', remaining != null && name ? { message: `${name} is running low (${remaining} left).` } : {})

// Admin helpers
export const showAdminAccessDenied = () => showKey('admin-access-denied')
export const showAdminLoginRequired = () => showKey('admin-login-required')
export const showDashboardLoadFailed = (msg) => showKey('dashboard-load-failed', msg ? { message: msg } : {})
export const showUserSuspensionSuccess = (userIdOrEmail) =>
  showKey('user-suspension-success', userIdOrEmail ? { message: `User ${userIdOrEmail} has been suspended.` } : {})
export const showSettingsSaveFailed = (msg) => showKey('settings-save-failed', msg ? { message: msg } : {})

