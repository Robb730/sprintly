import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 6
const MARGIN = 8

export default function FloatingPopover({ anchorRef, open, onClose, children, className = '' }) {
  const popRef = useRef(null)
  const [pos, setPos] = useState(null)

  const update = () => {
    const a = anchorRef.current
    const p = popRef.current
    if (!a || !p) return
    const r = a.getBoundingClientRect()
    const ph = p.offsetHeight
    const pw = p.offsetWidth
    const vw = window.innerWidth
    const vh = window.innerHeight

    const spaceBelow = vh - r.bottom - GAP - MARGIN
    const spaceAbove = r.top - GAP - MARGIN
    const above = spaceBelow < ph && spaceAbove > spaceBelow

    let top = above ? r.top - ph - GAP : r.bottom + GAP
    top = Math.max(MARGIN, Math.min(top, vh - ph - MARGIN))

    let left = Math.max(MARGIN, Math.min(r.left, vw - pw - MARGIN))

    setPos({ top, left })
  }

  // Measure + position before paint (no flicker)
  useLayoutEffect(() => {
    if (!open) { setPos(null); return }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true) // capture: catches the form's scroll too
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  // Outside click + Escape
  useEffect(() => {
    if (!open) return
    const onDown = e => {
      if (popRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose?.()
    }
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose?.() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={popRef}
      className={className}
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        visibility: pos ? 'visible' : 'hidden', // render hidden first so we can measure
        zIndex: 60,                              // above the modal's z-50
      }}
    >
      {children}
    </div>,
    document.body
  )
}