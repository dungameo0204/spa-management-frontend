import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// Persistent reference catalogs must not leak fixtures between test cases.
afterEach(() => { localStorage.clear(); sessionStorage.clear() })