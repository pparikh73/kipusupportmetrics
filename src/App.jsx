import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AgentPerformance from './pages/AgentPerformance'
import TeamDashboard from './pages/LeaderDashboard'
import AttendanceSummary from './pages/AttendanceSummary'
import AttendanceEntry from './pages/AttendanceEntry'
import AdminAgents from './pages/admin/AdminAgents'
import AdminTeams from './pages/admin/AdminTeams'
import AdminTeamAssignments from './pages/admin/AdminTeamAssignments'
import AdminMetrics from './pages/admin/AdminMetrics'
import AdminGoals from './pages/admin/AdminGoals'
import AdminNotes from './pages/admin/AdminNotes'
import Help from './pages/Help'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<AgentPerformance />} />
          <Route path="/team-dashboard" element={<TeamDashboard />} />
          <Route path="/attendance" element={<AttendanceSummary />} />
          <Route path="/attendance/entry" element={<AttendanceEntry />} />
          <Route path="/admin/agents" element={<AdminAgents />} />
          <Route path="/admin/teams" element={<AdminTeams />} />
          <Route path="/admin/team-assignments" element={<AdminTeamAssignments />} />
          <Route path="/admin/metrics" element={<AdminMetrics />} />
          <Route path="/admin/goals" element={<AdminGoals />} />
          <Route path="/admin/notes" element={<AdminNotes />} />
          <Route path="/help" element={<Help />} />
          <Route path="/help/:articleId" element={<Help />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
