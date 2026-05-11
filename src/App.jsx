import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AgentPerformance from './pages/AgentPerformance'
import TeamDashboard from './pages/LeaderDashboard'
import AttendanceSummary from './pages/AttendanceSummary'
import AttendanceEntry from './pages/AttendanceEntry'
import AdminOrganizations from './pages/admin/AdminOrganizations'
import AdminGroups from './pages/admin/AdminGroups'
import AdminAgents from './pages/admin/AdminAgents'
import AdminMetrics from './pages/admin/AdminMetrics'
import AdminTargets from './pages/admin/AdminTargets'
import AdminTolerances from './pages/admin/AdminTolerances'
import AdminAttendanceCodes from './pages/admin/AdminAttendanceCodes'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<AgentPerformance />} />
          <Route path="/leader-dashboard" element={<TeamDashboard />} />
          <Route path="/attendance" element={<AttendanceSummary />} />
          <Route path="/attendance/entry" element={<AttendanceEntry />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/groups" element={<AdminGroups />} />
          <Route path="/admin/agents" element={<AdminAgents />} />
          <Route path="/admin/metrics" element={<AdminMetrics />} />
          <Route path="/admin/targets" element={<AdminTargets />} />
          <Route path="/admin/tolerances" element={<AdminTolerances />} />
          <Route path="/admin/attendance-codes" element={<AdminAttendanceCodes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
