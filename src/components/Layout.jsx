import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const NAV = [
  {
    group: 'Performance',
    items: [
      { label: 'Agent Performance', to: '/' },
      { label: 'Team Dashboard', to: '/team-dashboard' },
    ],
  },
  {
    group: 'Attendance',
    items: [
      { label: 'Attendance Summary', to: '/attendance' },
      { label: 'Attendance Entry', to: '/attendance/entry' },
    ],
  },
  {
    group: 'People & Assignment',
    items: [
      { label: 'Agents', to: '/admin/agents' },
      { label: 'Teams', to: '/admin/teams' },
      { label: 'Team Assignments', to: '/admin/team-assignments' },
    ],
  },
  {
    group: 'Metric Setup',
    items: [
      { label: 'Metrics', to: '/admin/metrics' },
      { label: 'Goals', to: '/admin/goals' },
      { label: 'Notes', to: '/admin/notes' },
    ],
  },
]

function getSidebarPref() {
  try { return localStorage.getItem('ktp_sidebar') !== 'closed' } catch { return true }
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(getSidebarPref)

  function toggle() {
    const next = !open
    setOpen(next)
    try { localStorage.setItem('ktp_sidebar', next ? 'open' : 'closed') } catch {}
  }

  return (
    <div className="app-shell">
      <nav className={`sidebar${open ? '' : ' sidebar-collapsed'}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center' }}>
            {open && <div>Kipu Tracker<span>Support Performance</span></div>}
            <button className="sidebar-toggle" onClick={toggle} title={open ? 'Collapse' : 'Expand'}>
              {open ? '◀' : '▶'}
            </button>
          </div>
        </div>
        {open && (
          <div className="sidebar-nav">
            {NAV.map((section) => (
              <div className="nav-group" key={section.group}>
                <div className="nav-label">{section.group}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/' || item.to === '/attendance'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        )}
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
