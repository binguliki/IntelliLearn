
import { useState, useCallback } from "react"

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}