import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

// Fontes — carregadas antes do CSS global para evitar FOUC
// Sistema de duas vozes Anju: Lexend (display) + Outfit (UI e metadados)
import '@fontsource/lexend/300.css'
import '@fontsource/lexend/400.css'
import '@fontsource/lexend/500.css'
import '@fontsource/lexend/600.css'
import '@fontsource/lexend/700.css'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'

import './styles/globals.css'
import { ToastProvider } from './components/ui'
import { ThemeProvider } from './lib/theme'
import { SessionProvider } from './lib/session'
import { PresenceProvider } from './lib/presence'
import { RequireAuth } from './lib/RequireAuth'
import { LoginPage } from './pages/Login'
import { ClientsProvider } from './app/clients'
import { EditorialProvider } from './app/editorial'
import { ContentProvider } from './app/content'
import { TasksProvider } from './app/tasks'
import { ProfilesProvider } from './app/profiles'
import { AgendaProvider } from './app/agenda'
import { StyleguidePage } from './pages/Styleguide'
import { AppShell } from './app/AppShell'
import { DashboardPage } from './app/DashboardPage'
import { UsersPage } from './app/UsersPage'
import { AgendaPage } from './app/AgendaPage'
import { TasksPage } from './app/TasksPage'
import { AccessPage } from './app/AccessPage'
import { ContentPage } from './app/ContentPage'
import { EditorialPage } from './app/EditorialPage'
import { PlaceholderPage } from './app/PlaceholderPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/styleguide', element: <StyleguidePage /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'editorial', element: <EditorialPage /> },
      { path: 'tarefas', element: <TasksPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'conteudo', element: <ContentPage /> },
      { path: 'acessos', element: <AccessPage /> },
      { path: 'usuarios', element: <UsersPage /> },
      { path: 'integracoes', element: <PlaceholderPage eyebrow="Sistema" title="Integrações" /> },
      { path: 'config', element: <PlaceholderPage eyebrow="Sistema" title="Configurações" /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <PresenceProvider>
        <ClientsProvider>
          <EditorialProvider>
            <ContentProvider>
              <ProfilesProvider>
                <TasksProvider>
                  <AgendaProvider>
                    <ToastProvider>
                      <RouterProvider router={router} />
                    </ToastProvider>
                  </AgendaProvider>
                </TasksProvider>
              </ProfilesProvider>
            </ContentProvider>
          </EditorialProvider>
        </ClientsProvider>
        </PresenceProvider>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
)
