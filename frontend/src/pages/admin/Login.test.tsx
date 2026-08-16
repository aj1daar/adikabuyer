import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import login from '../../api/login'
import useAuthStore from '../../store/useAuthStore'

vi.mock('../../api/login', () => ({
  default: vi.fn(),
}))

const mockedLogin = vi.mocked(login)

beforeEach(() => {
  mockedLogin.mockReset()
  useAuthStore.setState({ token: null })
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  it('disables submit until both fields are filled', () => {
    renderLogin()

    expect(screen.getByRole('button', { name: /войти/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'admin' } })
    expect(screen.getByRole('button', { name: /войти/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'admin123' } })
    expect(screen.getByRole('button', { name: /войти/i })).toBeEnabled()
  })

  it('stores the token and redirects on successful login', async () => {
    mockedLogin.mockResolvedValueOnce({ token: 'jwt-token', tokenType: 'Bearer' })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt-token'))
  })

  it('shows an error message on failed login and does not store a token', async () => {
    mockedLogin.mockRejectedValueOnce(new Error('Unauthorized'))

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Логин'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() =>
      expect(screen.getByText('Неверный логин или пароль.')).toBeInTheDocument()
    )
    expect(useAuthStore.getState().token).toBeNull()
  })
})
