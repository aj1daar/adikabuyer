import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import login from '../../api/login'
import useAuthStore from '../../store/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await login({ username, password })
      setToken(response.token)
      navigate('/admin', { replace: true })
    } catch {
      setError('Неверный логин или пароль.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-ink/10 p-8 shadow-sm"
      >
        <h1 className="font-grotesk text-xl font-semibold text-ink">Вход в админ-панель</h1>

        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Логин"
          className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль"
          className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || username.trim() === '' || password.trim() === ''}
          className="rounded-pill bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
