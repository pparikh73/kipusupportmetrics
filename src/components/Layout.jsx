import { NavLink } from 'react-router-dom'

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

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          Kipu Tracker
          <span>Support Performance</span>
        </div>
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
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
