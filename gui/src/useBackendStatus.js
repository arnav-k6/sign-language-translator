import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:5001'

/**
 * Hook to track backend connectivity. Polls /status every 2s.
 * Returns { isOnline, lastError }
 */
export function useBackendStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastError, setLastError] = useState(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/status`)
        if (res.ok) {
          setIsOnline(true)
          setLastError(null)
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
      } catch (err) {
        setIsOnline(false)
        setLastError(err.message || 'Connection failed')
      }
    }

    check()
    const interval = setInterval(check, 2000)
    return () => clearInterval(interval)
  }, [])

  return { isOnline, lastError }
}
