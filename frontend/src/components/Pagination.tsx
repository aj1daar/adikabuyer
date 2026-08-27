type PaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

type PageEntry = number | 'ellipsis'

function getPageEntries(current: number, totalPages: number): PageEntry[] {
  const entries: PageEntry[] = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - current) <= 1) {
      entries.push(i)
    } else if (entries[entries.length - 1] !== 'ellipsis') {
      entries.push('ellipsis')
    }
  }
  return entries
}

export default function Pagination({ page, pageSize, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Страницы" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        aria-label="Предыдущая страница"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-sm font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        ←
      </button>

      {getPageEntries(page, totalPages).map((entry, index) =>
        entry === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 font-grotesk text-sm font-bold text-ink/40">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-black font-grotesk text-sm font-bold transition ${
              entry === page ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-bubblegum hover:text-white'
            }`}
          >
            {entry + 1}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Следующая страница"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-sm font-bold text-ink transition hover:bg-bubblegum hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        →
      </button>
    </nav>
  )
}
