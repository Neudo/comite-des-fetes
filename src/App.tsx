import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/hooks/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { LoginPage } from '@/pages/Login'
import { PublicReservationRequestPage } from '@/pages/PublicReservationRequest'
import { PublicInfoPage } from '@/pages/PublicInfoPage'
import { DashboardPage } from '@/pages/Dashboard'
import { LocationsPage } from '@/pages/Locations'
import { ReservationsPage } from '@/pages/Reservations'
import { CalendrierPage } from '@/pages/Calendrier'
import { InventairePage } from '@/pages/Inventaire'
import { TarificationPage } from '@/pages/Tarification'
import { HistoriquePage } from '@/pages/Historique'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route index element={<PublicReservationRequestPage />} />
            <Route path="/contact" element={<PublicInfoPage kind="contact" />} />
            <Route
              path="/mentions-legales"
              element={<PublicInfoPage kind="mentions-legales" />}
            />
            <Route
              path="/confidentialite"
              element={<PublicInfoPage kind="confidentialite" />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="locations" element={<LocationsPage />} />
                <Route path="calendrier" element={<CalendrierPage />} />
                <Route path="inventaire" element={<InventairePage />} />
                <Route path="tarification" element={<TarificationPage />} />
                <Route path="historique" element={<HistoriquePage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
