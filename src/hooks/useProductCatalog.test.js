import { afterEach, expect, it, vi } from 'vitest'
import { listResource } from '../api/resources'
import { clearBranchCatalogCache, clearStaffCatalogCache, filterProductCatalog, loadProductCatalog, loadResourceCatalog, normalizeSearchText, readCatalog, writeCatalog } from './useProductCatalog'

vi.mock('../api/resources', () => ({ listResource: vi.fn() }))

afterEach(() => { localStorage.clear(); vi.clearAllMocks() })

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

it('loads staff and branch catalogs through the same paginated loader', async () => {
  listResource.mockResolvedValue({ data: [{ id: 1 }], totalPages: 1 })
  await expect(loadResourceCatalog('staffs')).resolves.toEqual([{ id: 1 }])
  await expect(loadResourceCatalog('branches')).resolves.toEqual([{ id: 1 }])
  expect(listResource).toHaveBeenNthCalledWith(1, 'staffs', {}, 1, 100, undefined)
  expect(listResource).toHaveBeenNthCalledWith(2, 'branches', {}, 1, 100, undefined)
})

it('persists each reference catalog by tenant and clears only its matching resource cache', () => {
  localStorage.setItem('xuly.session', JSON.stringify({ tenant: { id: 11 } }))
  writeCatalog('staffs', [{ id: 1, fullname: 'Lan' }])
  writeCatalog('branches', [{ id: 2, name: 'Quận 1' }])
  expect(readCatalog('staffs')?.data).toEqual([{ id: 1, fullname: 'Lan' }])
  expect(readCatalog('branches')?.data).toEqual([{ id: 2, name: 'Quận 1' }])
  clearStaffCatalogCache()
  expect(readCatalog('staffs')).toBeUndefined()
  expect(readCatalog('branches')?.data).toEqual([{ id: 2, name: 'Quận 1' }])
  clearBranchCatalogCache()
  expect(readCatalog('branches')).toBeUndefined()
  localStorage.setItem('xuly.session', JSON.stringify({ tenant: { id: 12 } }))
  expect(readCatalog('staffs')).toBeUndefined()
})