import { getResource } from '../api/resources'

// Only persisted records go to the printer; never construct a receipt from draft form values.
export async function loadReceipt(type, ids) {
  const records = await Promise.all(ids.map(id => getResource(type, id)))
  return { type, records }
}