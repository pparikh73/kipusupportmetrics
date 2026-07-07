// Build a CSV string from headers + rows and trigger a browser download

function csvEscape(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((r) => r.map(csvEscape).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Excel download — the xlsx library loads on demand so it never weighs down
// normal page loads
export async function downloadXlsx(filename, headers, rows, sheetName = 'Data') {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

// Read tabular rows (arrays of cell strings) from a .csv or .xlsx/.xls file
export async function readTableFile(file) {
  const name = String(file.name ?? '').toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(await file.arrayBuffer(), { raw: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' })
    return rows.map((r) => r.map((v) => String(v ?? '').trim()))
  }
  const text = await file.text()
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((line) => line.split(',').map((s) => s.replace(/^"|"$/g, '').trim()))
}

// Normalize a date cell to YYYY-MM-DD; returns null if unrecognized
export function normalizeDate(v) {
  const s = String(v ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3]
    return `${year}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  }
  return null
}
