import { useEffect, useState } from 'react'

export function useRestTimer() {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) return

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setIsRunning(false)

          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
          }

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, secondsRemaining])

  return {
    secondsRemaining,
    isRunning,
    start: (seconds: number) => {
      setSecondsRemaining(seconds)
      setIsRunning(true)
    },
    pause: () => setIsRunning(false),
    resume: () => {
      if (secondsRemaining > 0) setIsRunning(true)
    },
    reset: () => {
      setSecondsRemaining(0)
      setIsRunning(false)
    },
  }
}
