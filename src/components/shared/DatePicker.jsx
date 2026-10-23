import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const GAP = 6      // space between trigger and popover
const MARGIN = 8   // minimum space to the viewport edge

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function formatDateStr(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// The visible region of `el` after intersecting every clipping ancestor
// (e.g. the modal card and the scrollable form) with the viewport.
function getClipRect(el) {
  const clip = { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight }
  let node = el.parentElement
  while (node && node !== document.body) {
    const s = getComputedStyle(node)
    if (/(auto|scroll|hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY)) {
      const r = node.getBoundingClientRect()
      clip.top = Math.max(clip.top, r.top)
      clip.left = Math.max(clip.left, r.left)
      clip.right = Math.min(clip.right, r.right)
      clip.bottom = Math.min(clip.bottom, r.bottom)
    }
    node = node.parentElement
  }
  return clip
}

function Calendar({ value, onChange, minDate, maxDate }) {
  const selected = parseDate(value)
  const [viewDate, setViewDate] = useState(selected || new Date())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const min = parseDate(minDate)
  const max = parseDate(maxDate)
  const outOfRange = (d) => (min && d < min) || (max && d > max)

  useEffect(() => {
    if (selected) { const t = setTimeout(() => setViewDate(selected), 0); return () => clearTimeout(t) }
  }, [value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div style={{ width: 260 }}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="w-9 h-9 -mx-1 flex items-center justify-center rounded-lg transition-all hover:opacity-70"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)' }} aria-label="Previous month">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {MONTHS[month]} {year}
        </span>
        <button type="button" onClick={nextMonth} className="w-9 h-9 -mx-1 flex items-center justify-center rounded-lg transition-all hover:opacity-70"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)' }} aria-label="Next month">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-[10px] font-medium py-1" style={{ color: 'var(--text-muted)' }}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const isSelected = isSameDay(d, selected)
          const isToday = isSameDay(d, today)
          const isDisabled = outOfRange(d)
          return (
            <button
              type="button"
              key={i}
              disabled={isDisabled}
              aria-label={d.toDateString()}
              aria-pressed={isSelected}
              onClick={() => onChange(formatDateStr(d))}
              className="aspect-square flex items-center justify-center rounded-lg text-xs transition-all"
              style={{
                background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-light)' : 'transparent',
                color: isSelected ? '#fff' : isToday ? 'var(--accent)' : isDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: isDisabled ? 0.35 : 1,
                fontWeight: isSelected || isToday ? 600 : 400,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.background = 'var(--bg-primary)' }}
              onMouseLeave={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.background = isToday ? 'var(--accent-light)' : 'transparent' }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <div className="mt-3 pt-3 flex justify-between" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" disabled={outOfRange(today)} onClick={() => onChange(formatDateStr(today))}
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)', opacity: outOfRange(today) ? 0.35 : 1, cursor: outOfRange(today) ? 'not-allowed' : 'pointer' }}>
          Today
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', minDate, maxDate, className = '' }) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pos, setPos] = useState(null) // { top, left, flip } once measured

  const anchorRef = useRef(null)   // wrapper the popover is aligned to
  const triggerRef = useRef(null)  // the button (for returning focus)
  const popoverRef = useRef(null)
  const animatedRef = useRef(false)

  const parsed = parseDate(value)
  const displayValue = parsed
    ? parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // Measure the real popover and the trigger, then place it: below by default,
  // flipped above when there isn't room, always clamped inside the viewport.
  const place = useCallback(() => {
    const a = anchorRef.current
    const p = popoverRef.current
    if (!a || !p) return

    const r = a.getBoundingClientRect()

    // The trigger was scrolled out of view inside the form: close instead of floating in space.
    const clip = getClipRect(a)
    if (r.bottom <= clip.top || r.top >= clip.bottom) { setOpen(false); return }

    const pw = p.offsetWidth
    const ph = p.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    const spaceBelow = vh - r.bottom - GAP - MARGIN
    const spaceAbove = r.top - GAP - MARGIN
    const flip = ph > spaceBelow && spaceAbove > spaceBelow

    let top = flip ? r.top - GAP - ph : r.bottom + GAP
    top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, vh - ph - MARGIN))
    const left = Math.min(Math.max(r.left, MARGIN), Math.max(MARGIN, vw - pw - MARGIN))

    setPos(prev => (prev && prev.top === top && prev.left === left && prev.flip === flip) ? prev : { top, left, flip })
  }, [])

  // Place before paint so the popover never flashes in the wrong spot.
  useLayoutEffect(() => {
    if (!open) { setPos(null); animatedRef.current = false; return }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true) // capture: also catches the modal form's scroll
    // Month height changes (5 vs 6 rows) re-run placement so it stays attached.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null
    if (ro && popoverRef.current) ro.observe(popoverRef.current)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      ro?.disconnect()
    }
  }, [open, place])

  // Short entrance, only on first placement and only if motion is allowed.
  useLayoutEffect(() => {
    if (!pos || animatedRef.current) return
    animatedRef.current = true
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    popoverRef.current?.animate(
      [
        { opacity: 0, transform: `translateY(${pos.flip ? 4 : -4}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 120, easing: 'ease-out' }
    )
  }, [pos])

  // Outside click + Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (anchorRef.current?.contains(e.target) || popoverRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(true) }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, close])

  const popover = open ? createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Choose date"
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        visibility: pos ? 'visible' : 'hidden', // render hidden first so it can be measured
        zIndex: 99999,
        maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl, 16px)',
        boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.25))',
        padding: 12,
      }}
    >
      <Calendar
        value={value}
        onChange={(v) => { onChange(v); close(true) }}
        minDate={minDate}
        maxDate={maxDate}
      />
    </div>,
    document.body
  ) : null

  return (
    <div ref={anchorRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs outline-none transition-all"
        style={{
          background: 'var(--bg-primary)',
          border: `1px solid ${open || focused ? 'var(--accent)' : 'var(--border)'}`,
          color: displayValue ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {displayValue || placeholder}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {popover}
    </div>
  )
}