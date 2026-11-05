import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import TreatmentGroupSignature from './TreatmentGroupSignature'

vi.mock('./TreatmentGroupSessionDialog', () => ({ default: () => null }))

const card = { product_name: 'Liệu trình chữa nám' }
const user = { system_role: 'MANAGER' }

test('shows a simple signed label when only some sessions in a group are signed', () => {
  render(<TreatmentGroupSignature card={card} user={user} sessions={[
    { history: { id: 1, customer_signature_svg: '<svg />' } },
    { history: { id: 2 } },
  ]} />)

  expect(screen.getByText('Đã ký')).toBeInTheDocument()
  expect(screen.queryByText(/Đã ký \d+\/\d+ buổi/)).not.toBeInTheDocument()
})