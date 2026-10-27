export default function DetailNote({ note }) {
  if (!note?.trim()) return null
  return <section className="detail-section" aria-label="Ghi chú"><h3>Ghi chú</h3><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{note}</p></section>
}