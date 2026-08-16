import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StorefrontPage from './pages/StorefrontPage'
import Login from './pages/admin/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './router/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorefrontPage />} />
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
  )
}

export default App
