import React, { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

const NetworkStatusBanner = () => {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="sticky top-0 z-50 w-full">
      <div className="w-full bg-red-600 text-white">
        <div className="container py-2 flex items-center justify-center text-sm">
          <WifiOff className="h-4 w-4 mr-2" />
          You are offline. Some actions may not work until connection is restored.
        </div>
      </div>
    </div>
  )
}

export default NetworkStatusBanner

