import type { TelegramAdminDto } from '../../types/telegramAdmin'

type TelegramAdminsTableProps = {
  admins: TelegramAdminDto[]
  loading: boolean
  error: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TelegramAdminsTable({ admins, loading, error }: TelegramAdminsTableProps) {
  return (
    <>
      {loading && admins.length === 0 && <p className="mt-4 text-ink/60">Загрузка подписчиков...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {!error && (admins.length > 0 || !loading) && (
        <div className={`mt-6 overflow-x-auto ${loading ? 'opacity-60' : ''} transition-opacity`}>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Chat ID</th>
                <th className="py-2">Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.chatId} className="border-b border-ink/5">
                  <td className="py-2 pr-4 text-ink">{admin.username ?? '—'}</td>
                  <td className="py-2 pr-4 text-ink/70">{admin.chatId}</td>
                  <td className="py-2 text-ink/70">{formatDate(admin.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {admins.length === 0 && <p className="mt-4 text-ink/60">Пока никто не подписался.</p>}
        </div>
      )}
    </>
  )
}
