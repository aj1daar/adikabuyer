import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import AboutPage from './pages/AboutPage'
import Login from './pages/admin/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './router/ProtectedRoute'
import ScrollToTop from './router/ScrollToTop'
import WireframeTransition from './components/WireframeTransition'

function App() {
  return (
    // reducedMotion="user" makes every framer-motion animation on the site
    // honour the OS "reduce motion" setting automatically — pops become
    // plain fades, nothing to opt into per-component.
    <MotionConfig reducedMotion="user">
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
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
