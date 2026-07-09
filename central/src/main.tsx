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
import { NotificationsProvider } from './lib/notifications'
import { PermissionsProvider } from './lib/permissions'
import { RequireAuth } from './lib/RequireAuth'
import { LoginPage } from './pages/Login'
import { ClientsProvider } from './app/clients'
import { EditorialProvider } from './app/editorial'
import { TasksProvider } from './app/tasks'
import { CommentsProvider } from './app/comments'
import { AttachmentsProvider } from './app/attachments'
import { ProfilesProvider } from './app/profiles'
import { AgendaProvider } from './app/agenda'
import { CatalogsProvider } from './app/catalogs'
import { PaidTrafficProvider } from './app/paidTraffic'
import { CrmProvider } from './app/crm'
import { WaitlistProvider } from './app/waitlist'
import { CsProvider } from './app/cs'
import { ChatProvider } from './app/chat'
import { StyleguidePage } from './pages/Styleguide'
import { AppShell } from './app/AppShell'
import { DashboardPage } from './app/DashboardPage'
import { UsersPage } from './app/UsersPage'
import { PermissionsPage } from './app/PermissionsPage'
import { CatalogsPage } from './app/CatalogsPage'
import { AgendaPage } from './app/AgendaPage'
import { TasksPage } from './app/TasksPage'
import { ReportsPage } from './app/ReportsPage'
import { PaidTrafficPage } from './app/PaidTrafficPage'
import { CrmPage } from './app/CrmPage'
import { WaitlistPage } from './app/WaitlistPage'
import { CsPage } from './app/CsPage'
import { AccessPage } from './app/AccessPage'
import { EditorialPage } from './app/EditorialPage'
import { ChatPage } from './app/ChatPage'

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
      { path: 'chat', element: <ChatPage /> },
      { path: 'tarefas', element: <TasksPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'relatorios', element: <ReportsPage /> },
      { path: 'trafego-pago', element: <PaidTrafficPage /> },
      { path: 'crm', element: <CrmPage /> },
      { path: 'lista-de-espera', element: <WaitlistPage /> },
      { path: 'cs', element: <CsPage /> },
      { path: 'acessos', element: <AccessPage /> },
      { path: 'usuarios', element: <UsersPage /> },
      { path: 'catalogos', element: <CatalogsPage /> },
      { path: 'config', element: <PermissionsPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <PermissionsProvider>
        <PresenceProvider>
        <NotificationsProvider>
        <ClientsProvider>
          <CatalogsProvider>
          <PaidTrafficProvider>
          <CrmProvider>
          <WaitlistProvider>
          <CsProvider>
          <EditorialProvider>
            <ProfilesProvider>
              <TasksProvider>
                <CommentsProvider>
                <AttachmentsProvider>
                <AgendaProvider>
                <ChatProvider>
                  <ToastProvider>
                    <RouterProvider router={router} />
                  </ToastProvider>
                </ChatProvider>
                </AgendaProvider>
                </AttachmentsProvider>
                </CommentsProvider>
              </TasksProvider>
            </ProfilesProvider>
          </EditorialProvider>
          </CsProvider>
          </WaitlistProvider>
          </CrmProvider>
          </PaidTrafficProvider>
          </CatalogsProvider>
        </ClientsProvider>
        </NotificationsProvider>
        </PresenceProvider>
        </PermissionsProvider>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
)
