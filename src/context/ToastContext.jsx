import { createContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeouts = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timeouts.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timeouts.current.delete(id)
    }
  }, [])

  const show = useCallback((type, message, opts = {}) => {
    const id = ++idCounter
    const toast = { id, type, message, duration: opts.duration ?? 4000, ...opts }
    setToasts(prev => [...prev, toast])
    return id
  }, [])

  useEffect(() => {
    return () => {
      for (const timer of timeouts.current.values()) clearTimeout(timer)
      timeouts.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ show, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export default ToastContext