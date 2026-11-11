import { useQuery } from '@tanstack/react-query'
import { listResource } from '../api/resources'

const CACHE_VERSION = 2
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000
const CACHE_PREFIX = `rosa.reference-catalog.v${CACHE_VERSION}`
const CATALOG_PAGE_SIZE = 100

function catalogScope() {
  try {
    const session = JSON.parse(localStorage.getItem('xuly.session'))
    return String(session?.tenant?.id || session?.user?.tenant_id || session?.user?.id || 'anonymous')
  } catch {
    return 'anonymous'
  }
}

function storageKey(resource, scope) { return `${CACHE_PREFIX}.${resource}.${scope}` }

export function readCatalog(resource, scope = catalogScope()) {
  try {
    const cached = JSON.parse(localStorage.getItem(storageKey(resource, scope)))
    if (!Array.isArray(cached?.data) || Date.now() - Number(cached.savedAt || 0) > CACHE_MAX_AGE) return undefined
    return cached
  } catch {
    return undefined
  }
}

export function writeCatalog(resource, data, scope = catalogScope()) {
  try {
    localStorage.setItem(storageKey(resource, scope), JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // Storage can be unavailable or full; React Query still keeps the in-memory cache.
  }
}

export function clearCatalogCache(resource) {
  try {
    const scope = catalogScope()
    localStorage.removeItem(storageKey(resource, scope))
  } catch {
    // Ignore storage access failures.
  }
}

export const clearProductCatalogCache = () => clearCatalogCache('products')
export const clearStaffCatalogCache = () => clearCatalogCache('staffs')
export const clearBranchCatalogCache = () => clearCatalogCache('branches')

export function normalizeSearchText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi-VN').trim()
}

export function filterProductCatalog(items, search, filters = {}) {
  const needle = normalizeSearchText(search)
  return (items || []).filter(item => Object.entries(filters).every(([key, value]) => value === '' || value == null || String(item[key]) === String(value)))
    .filter(item => !needle || normalizeSearchText([item.name, item.code, item.sku].filter(Boolean).join(' ')).includes(needle))
}

export async function loadResourceCatalog(resource, signal) {
  const first = await listResource(resource, {}, 1, CATALOG_PAGE_SIZE, signal)
  const pages = Math.max(1, Number(first.totalPages) || 1)
  const items = [...first.data]
  for (let page = 2; page <= pages; page += 1) {
    const result = await listResource(resource, {}, page, CATALOG_PAGE_SIZE, signal)
    items.push(...result.data)
  }
  return items
}

export const loadProductCatalog = signal => loadResourceCatalog('products', signal)
export const loadStaffCatalog = signal => loadResourceCatalog('staffs', signal)
export const loadBranchCatalog = signal => loadResourceCatalog('branches', signal)

export function useResourceCatalog(resource, { enabled = true } = {}) {
  const scope = catalogScope()
  const cached = readCatalog(resource, scope)
  return useQuery({
    queryKey: [`${resource}-catalog`, scope],
    queryFn: async ({ signal }) => {
      const data = await loadResourceCatalog(resource, signal)
      writeCatalog(resource, data, scope)
      return data
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.savedAt,
    enabled,
    staleTime: CACHE_MAX_AGE,
    gcTime: 7 * CACHE_MAX_AGE,
    refetchOnWindowFocus: false,
  })
}

export const useProductCatalog = options => useResourceCatalog('products', options)
export const useStaffCatalog = options => useResourceCatalog('staffs', options)
export const useBranchCatalog = options => useResourceCatalog('branches', options)