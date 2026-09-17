import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import Login from './pages/admin/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './router/ProtectedRoute'
import ScrollToTop from './router/ScrollToTop'
import WireframeTransition from './components/WireframeTransition'

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
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
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
