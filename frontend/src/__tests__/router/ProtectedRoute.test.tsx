import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../../router/ProtectedRoute'
import useAuthStore from '../../store/useAuthStore'

beforeEach(() => {
  useAuthStore.setState({ token: null })
})

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/login" element={<p>Login page</p>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <p>Protected content</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to the login page when unauthenticated', () => {
    renderProtected('/admin')

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content when authenticated', () => {
    useAuthStore.setState({ token: 'valid-token' })

    renderProtected('/admin')

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
