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
      { label: 'Organizations', to: '/admin/organizations' },
      { label: 'Groups', to: '/admin/groups' },
      { label: 'Agents', to: '/admin/agents' },
    ],
  },
  {
    group: 'Metric Setup',
    items: [
      { label: 'Metrics', to: '/admin/metrics' },
      { label: 'Targets', to: '/admin/targets' },
      { label: 'Tolerances', to: '/admin/tolerances' },
    ],
  },
  {
    group: 'Attendance Setup',
    items: [
      { label: 'Attendance Codes', to: '/admin/attendance-codes' },
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
                  end={item.to === '/'}
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
