import { useState, useEffect } from 'react'

// APT-143: the browser's built-in date box shows whatever order the computer's
// region setting uses (dd/mm/yyyy on a UK or India machine) and that cannot be
// overridden from code. This control types and displays strictly MM/DD/YYYY
// while still storing the ISO value (YYYY-MM-DD) the database expects.
// The calendar button is a real date input laid invisibly over the icon, so the
// pop-up calendar still works — only its locale-formatted text is hidden.

// Older team assignments were saved as YYYY-MM; treat them as the 1st
function toIsoDay(v) {
  if (!v) return ''
  const s = String(v).slice(0, 10)
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
}

function isoToUS(v) {
  const iso = toIsoDay(v)
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function usToIso(text) {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, mm, dd, yyyy] = m
  const month = Number(mm)
  const day = Number(dd)
  const year = Number(yyyy)
  const d = new Date(Date.UTC(year, month - 1, day))
  // Rejects impossible dates like 02/31/2026, which Date would roll forward
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return `${yyyy}-${mm}-${dd}`
}

// Inserts the slashes as the user types, so they only ever enter digits
function maskTyping(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export default function DateInput({ value, onChange, className = 'form-input', style }) {
  const [text, setText] = useState(() => isoToUS(value))

  // Follow the saved value when the form is reloaded or switched to another record
  useEffect(() => { setText(isoToUS(value)) }, [value])

  const handleType = (raw) => {
    const next = maskTyping(raw)
    setText(next)
    if (next === '') { onChange(null); return }
    const iso = usToIso(next)
    if (iso) onChange(iso)
  }

  // A half-typed or impossible date is put back to whatever is saved
  const handleBlur = () => {
    if (text === '') { onChange(null); return }
    const iso = usToIso(text)
    if (iso) { setText(isoToUS(iso)); onChange(iso) }
    else setText(isoToUS(value))
  }

  const openCalendar = (e) => {
    try { e.currentTarget.showPicker() } catch (_) { /* older browser — its own icon still opens it */ }
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        className={className}
        type="text"
        inputMode="numeric"
        placeholder="MM/DD/YYYY"
        maxLength={10}
        value={text}
        onChange={(e) => handleType(e.target.value)}
        onBlur={handleBlur}
        style={{ width: '100%', paddingRight: 34 }}
      />
      <span
        aria-hidden="true"
        style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, opacity: 0.6, pointerEvents: 'none' }}
      >
        📅
      </span>
      <input
        type="date"
        aria-label="Open calendar"
        tabIndex={-1}
        value={toIsoDay(value)}
        onClick={openCalendar}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          position: 'absolute', right: 0, top: 0, height: '100%', width: 34,
          opacity: 0, cursor: 'pointer', border: 'none', padding: 0, background: 'transparent',
        }}
      />
    </div>
  )
}
