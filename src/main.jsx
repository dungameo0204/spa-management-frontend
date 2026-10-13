import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthProvider'
import App from './app/App'
import ErrorAlertFocus from './components/ErrorAlertFocus'
import { ThemeProvider } from './components/ThemeProvider'
import './styles/tokens.css'
import './styles/global.css'
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true, refetchOnMount: 'always' } } })
createRoot(document.getElementById('root')).render(<React.StrictMode><QueryClientProvider client={client}><ThemeProvider><AuthProvider><ErrorAlertFocus /><App /></AuthProvider></ThemeProvider></QueryClientProvider></React.StrictMode>)