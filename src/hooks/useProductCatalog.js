import { useQuery } from '@tanstack/react-query'
import { listResource } from '../api/resources'

const CACHE_VERSION = 1
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000
const CACHE_PREFIX = `rosa.product-catalog.v${CACHE_VERSION}`
const PRODUCT_CATALOG_PAGE_SIZE = 100

function catalogScope() {
  try {
    const session = JSON.parse(localStorage.getItem('xuly.session'))
    return String(session?.tenant?.id || session?.user?.tenant_id || session?.user?.id || 'anonymous')
  } catch {
    return 'anonymous'
  }
}

function storageKey(scope) { return `${CACHE_PREFIX}.${scope}` }

function readCatalog(scope) {
  try {
    const cached = JSON.parse(localStorage.getItem(storageKey(scope)))
    if (!Array.isArray(cached?.data) || Date.now() - Number(cached.savedAt || 0) > CACHE_MAX_AGE) return undefined
    return cached
  } catch {
    return undefined
  }
}

function writeCatalog(scope, data) {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // Storage can be unavailable or full; React Query still keeps the in-memory cache.
  }
}

export function clearProductCatalogCache() {
  try {
    const scope = catalogScope()
    localStorage.removeItem(storageKey(scope))
  } catch {
    // Ignore storage access failures.
  }
}

export function normalizeSearchText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi-VN').trim()
}

export function filterProductCatalog(items, search, filters = {}) {
  const needle = normalizeSearchText(search)
  return (items || []).filter(item => Object.entries(filters).every(([key, value]) => value === '' || value == null || String(item[key]) === String(value)))
    .filter(item => !needle || normalizeSearchText([item.name, item.code, item.sku].filter(Boolean).join(' ')).includes(needle))
}

export async function loadProductCatalog(signal) {
  const first = await listResource('products', {}, 1, PRODUCT_CATALOG_PAGE_SIZE, signal)
  const pages = Math.max(1, Number(first.totalPages) || 1)
  const items = [...first.data]
  for (let page = 2; page <= pages; page += 1) {
    const result = await listResource('products', {}, page, PRODUCT_CATALOG_PAGE_SIZE, signal)
    items.push(...result.data)
  }
  return items
}

export function useProductCatalog({ enabled = true } = {}) {
  const scope = catalogScope()
  const cached = readCatalog(scope)
  return useQuery({
    queryKey: ['product-catalog', scope],
    queryFn: async ({ signal }) => {
      const data = await loadProductCatalog(signal)
      writeCatalog(scope, data)
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