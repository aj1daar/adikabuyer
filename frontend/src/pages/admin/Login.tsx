import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import login from '../../api/login'
import useAuthStore from '../../store/useAuthStore'
import usePageTitle from '../../hooks/usePageTitle'

export default function Login() {
  usePageTitle('Вход')
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
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border-2 border-black bg-white p-8 shadow-[6px_6px_0_0_#E8799F]"
      >
        <h1 className="font-grotesk text-xl font-bold text-ink">Вход в админ-панель</h1>

        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Логин"
          className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль"
          className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || username.trim() === '' || password.trim() === ''}
          className="rounded-pill border-2 border-black bg-ink px-4 py-3 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
