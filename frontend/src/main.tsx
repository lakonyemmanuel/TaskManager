import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AuthPage from './features/auth/AuthPage.tsx'
import DashboardPage from './features/dashboard/DashboardPage.tsx'
import KanbanPage from './features/kanban/KanbanPage.tsx'
import ReportsPage from './features/reports/ReportsPage.tsx'
import AppLayout from './shared/layout/AppLayout.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
