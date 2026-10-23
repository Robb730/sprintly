import { useEffect, useCallback } from 'react'

const DEFAULTS = {
  'mod+k': () => {},
  'n': () => {},
  'escape': () => {},
  '/': () => {},
  '?': () => {},
}

export function useKeyboardShortcuts(shortcuts = {}) {
  const merged = { ...DEFAULTS, ...shortcuts }

  const handler = useCallback((e) => {
    const target = e.target
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    // Build key string
    const mod = e.metaKey || e.ctrlKey
    let key = e.key.toLowerCase()
    if (mod && key === 'k') key = 'mod+k'
    if (mod && key === 'n') key = 'mod+n'

    // Skip single-key shortcuts when focused in input
    const isSingle = !key.includes('mod+') && key !== 'escape'
    if (isInput && isSingle && key !== '/') return

    const fn = merged[key]
    if (fn) {
      e.preventDefault()
      fn(e)
    }
  }, [merged])

  useEffect(() => {
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handler])
}

export default useKeyboardShortcuts