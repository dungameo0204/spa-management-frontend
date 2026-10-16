export function groupCommissionRows(rows) {
  const groups = new Map()
  for (const row of rows) {
    const raw = row.commission_amount
    const amount = Number(raw)
    if (raw == null || raw === '' || !Number.isFinite(amount)) throw new Error('Dữ liệu công ca thiếu hoặc không hợp lệ. Không thể tổng hợp báo cáo.')
    const cents = Math.round(amount * 100)
    groups.set(cents, (groups.get(cents) || 0) + 1)
  }
  return [...groups].sort(([a], [b]) => a - b).map(([cents, quantity]) => ({ amount: cents / 100, quantity, total: cents * quantity / 100 }))
}

export async function loadCommissionReport(loadPage) {
  const first = await loadPage(1)
  const rows = [...(first.data || [])]
  for (let page = 2; page <= first.totalPages; page++) {
    const result = await loadPage(page)
    rows.push(...(result.data || []))
  }
  if (first.total != null && rows.length !== Number(first.total)) throw new Error('Chưa tải đủ dữ liệu công ca. Vui lòng thử lại.')
  return groupCommissionRows(rows)
}