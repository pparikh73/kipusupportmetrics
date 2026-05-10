import { useState, useEffect, useCallback } from 'react'
import {
  getOrganizations, getGroups, getAgents,
  getAttendanceCodes, getAttendanceDaily,
  upsertAttendance, deleteAttendance,
} from '../lib/api'
import { currentMonth, recentMonths } from '../lib/format'
import Modal from '../components/Modal'

function getWeekdays(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number)
  const days = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function AttendanceEntry() {
  const months = recentMonths(18)
  const [orgs, setOrgs] = useState([])
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])
  const [codes, setCodes] = useState([])

  const [orgId, setOrgId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [month, setMonth] = useState(currentMonth())

  // Map: "agentId:dateISO" -> row data from view
  const [attMap, setAttMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  // Modal state for cell editing
  const [editCell, setEditCell] = useState(null) // { agentId, date, dateISO, agent }

  useEffect(() => {
    getOrganizations().then(setOrgs).catch((e) => setError(e.message))
    getAttendanceCodes().then(setCodes).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    setGroupId('')
    getGroups(orgId || undefined).then(setGroups).catch((e) => setError(e.message))
  }, [orgId])

  useEffect(() => {
    getAgents(orgId || undefined, groupId || undefined).then(setAgents).catch((e) => setError(e.message))
  }, [orgId, groupId])

  const loadAttendance = useCallback(async () => {
    if (!month) return
    setLoading(true)
    setError('')
    try {
      const data = await getAttendanceDaily({
        month,
        externalGroupId: groupId || undefined,
      })
      const map = {}
      data.forEach((row) => {
        map[`${row.agent_id}:${row.attendance_date}`] = row
      })
      setAttMap(map)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [month, groupId])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  const weekdays = getWeekdays(month)

  const handleCellClick = (agent, day) => {
    setEditCell({ agentId: agent.id, date: day, dateISO: toIso(day), agent })
  }

  const handleSaveCell = async (codeId, notes) => {
    if (!editCell) return
    setSaving(true)
    setError('')
    try {
      const agent = editCell.agent
      if (codeId === null) {
        // Delete
        await deleteAttendance({ attendanceDate: editCell.dateISO, agentId: editCell.agentId })
        const newMap = { ...attMap }
        delete newMap[`${editCell.agentId}:${editCell.dateISO}`]
        setAttMap(newMap)
      } else {
        const row = {
          attendance_date: editCell.dateISO,
          agent_id: editCell.agentId,
          organization_id: agent.organization_id,
          external_group_id: agent.external_group_id,
          attendance_code_id: codeId,
          source: 'manual',
          notes: notes || null,
        }
        const saved = await upsertAttendance([row])
        // Re-fetch to get view data (code_name etc.)
        await loadAttendance()
      }
      setSaveMsg('Saved.')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
      setEditCell(null)
    }
  }

  const currentRow = editCell ? attMap[`${editCell.agentId}:${editCell.dateISO}`] : null

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Attendance Entry</h1>
        <p className="page-subtitle">Enter daily attendance for agents</p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {saveMsg && <div className="success-msg">{saveMsg}</div>}

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="filter-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Organization</label>
          <select className="filter-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Group</label>
          <select className="filter-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">All Groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
        </div>
      </div>

      {agents.length === 0 && !loading && (
        <div className="empty-state">
          <h3>No agents found</h3>
          <p>Select an organization or group to see agents.</p>
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      {!loading && agents.length > 0 && (
        <div className="att-grid">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 140 }}>Agent</th>
                {weekdays.map((d) => (
                  <th key={toIso(d)} title={toIso(d)}>
                    {DAY_LABELS[(d.getDay() + 6) % 7]}<br />
                    <span style={{ fontWeight: 400 }}>{d.getDate()}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="agent-col">{agent.agent_name}</td>
                  {weekdays.map((d) => {
                    const iso = toIso(d)
                    const entry = attMap[`${agent.id}:${iso}`]
                    return (
                      <td key={iso}>
                        <button
                          className={`att-cell-btn ${entry ? 'filled' : 'empty'}`}
                          onClick={() => handleCellClick(agent, d)}
                          title={entry ? `${entry.attendance_code}: ${entry.code_name}` : 'Click to enter'}
                        >
                          {entry ? entry.attendance_code : '·'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editCell && (
        <CellModal
          agent={editCell.agent}
          date={editCell.date}
          dateISO={editCell.dateISO}
          codes={codes}
          current={currentRow}
          saving={saving}
          onSave={handleSaveCell}
          onClose={() => setEditCell(null)}
        />
      )}
    </div>
  )
}

function CellModal({ agent, date, dateISO, codes, current, saving, onSave, onClose }) {
  const [codeId, setCodeId] = useState(current?.attendance_code_id ?? '')
  const [notes, setNotes] = useState(current?.notes ?? '')

  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <Modal
      title={`Attendance — ${agent.agent_name}`}
      onClose={onClose}
      footer={
        <>
          {current && (
            <button className="btn btn-danger" onClick={() => onSave(null, '')} disabled={saving}>
              Clear Entry
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(codeId ? Number(codeId) : null, notes)}
            disabled={saving || !codeId}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: '#6b7a8d', marginBottom: 16 }}>{dateLabel}</p>
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label">Attendance Code</label>
        <select className="form-select" value={codeId} onChange={(e) => setCodeId(e.target.value)}>
          <option value="">Select a code…</option>
          {codes.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.code_name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
    </Modal>
  )
}
