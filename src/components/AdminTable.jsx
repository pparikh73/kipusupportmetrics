export default function AdminTable({ columns, rows, onEdit, onToggleActive }) {
  if (!rows.length) {
    return (
      <div className="empty-state">
        <h3>No records found</h3>
        <p>Click Add to create the first entry.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
              <td>
                <span style={{ color: row.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>
                  {row.active ? 'Yes' : 'No'}
                </span>
              </td>
              <td>
                <button className="btn btn-sm btn-secondary" onClick={() => onEdit(row)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
