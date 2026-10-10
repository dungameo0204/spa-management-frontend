import { createContext, useContext, useEffect, useState } from 'react'
const Theme = createContext(null)
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('xuly.theme') === 'dark' ? 'dark' : 'light')
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('xuly.theme', theme) }, [theme])
  return <Theme.Provider value={{ theme, toggle: () => setTheme(value => value === 'dark' ? 'light' : 'dark') }}>{children}</Theme.Provider>
}
export const useTheme = () => useContext(Theme)