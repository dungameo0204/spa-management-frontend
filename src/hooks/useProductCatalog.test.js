import { expect, it, vi } from 'vitest'
import { listResource } from '../api/resources'
import { filterProductCatalog, loadProductCatalog, normalizeSearchText } from './useProductCatalog'

vi.mock('../api/resources', () => ({ listResource: vi.fn() }))

it('normalizes Vietnamese diacritics and filters the local product catalog', () => {
  const items = [{ id: 1, name: 'Chăm sóc da', is_product: 0 }, { id: 2, name: 'Kem dưỡng', is_product: 1 }]
  expect(normalizeSearchText('Chăm sóc ĐA')).toBe('cham soc da')
  expect(filterProductCatalog(items, 'cham soc', { is_product: 0 })).toEqual([items[0]])
  expect(filterProductCatalog(items, 'duong', { is_product: 0 })).toEqual([])
})

it('loads every product catalog page using the API maximum page size and query abort signal', async () => {
  const signal = new AbortController().signal
  listResource.mockImplementation(async (_resource, _filters, page) => ({ data: page === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }], totalPages: 2 }))

  await expect(loadProductCatalog(signal)).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  expect(listResource).toHaveBeenNthCalledWith(1, 'products', {}, 1, 100, signal)
  expect(listResource).toHaveBeenNthCalledWith(2, 'products', {}, 2, 100, signal)
})