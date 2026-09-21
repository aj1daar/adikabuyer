import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './router/ProtectedRoute'
import ScrollToTop from './router/ScrollToTop'
import WireframeTransition from './components/WireframeTransition'

// the admin panel (product form, cropper, orders) is its own chunk — shoppers never
// download it; only /admin and /admin/login fetch it
const Login = lazy(() => import('./pages/admin/Login'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

function AdminFallback() {
  return <p className="p-8 font-grotesk text-sm font-bold text-ink/50">Загрузка...</p>
}

function App() {
  return (
    // Animations keep running when the OS asks for reduced motion — "user" used to
    // flatten every pop into a plain fade, which read as a broken, static site on
    // phones with Reduce Motion on. The motion-heavy pieces (popIn/popInView, the
    // hero, the backdrop dots) check the setting themselves and switch to a
    // gentler, bounce-free version instead.
    <MotionConfig reducedMotion="never">
      <BrowserRouter>
        <ScrollToTop />
        <WireframeTransition />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:id" element={<ProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<AdminFallback />}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={<AdminFallback />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
