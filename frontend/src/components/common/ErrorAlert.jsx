import React from 'react'
import { AlertCircle } from 'lucide-react'

const variants = {
  error: {
    container: 'bg-red-50 border border-red-200 text-red-800',
    title: 'text-red-900',
    iconColor: 'text-red-600',
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    title: 'text-yellow-900',
    iconColor: 'text-yellow-600',
  },
  success: {
    container: 'bg-green-50 border border-green-200 text-green-800',
    title: 'text-green-900',
    iconColor: 'text-green-600',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200 text-blue-800',
    title: 'text-blue-900',
    iconColor: 'text-blue-600',
  },
}

const ErrorAlert = ({
  title = 'Something went wrong',
  message = 'Please try again.',
  icon: Icon = AlertCircle,
  variant = 'error',
  className = '',
}) => {
  const theme = variants[variant] || variants.error
  return (
    <div className={`rounded-lg p-3 flex items-start space-x-3 ${theme.container} ${className}`} role="alert">
      <Icon className={`h-5 w-5 mt-0.5 ${theme.iconColor}`} />
      <div className="text-sm">
        {title && <div className={`font-semibold ${theme.title}`}>{title}</div>}
        <div>{message}</div>
      </div>
    </div>
  )
}

export default ErrorAlert

