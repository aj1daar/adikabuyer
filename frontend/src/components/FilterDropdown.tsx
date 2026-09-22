import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type FilterDropdownOption = {
  label: string
  value: string
}

type FilterDropdownProps = {
  label: string
  options: FilterDropdownOption[]
  value: string
  onApply: (value: string) => void
}

/**
 * Desktop single-select filter. A pick applies at once and closes the list (picking the
 * active value again clears it) — no separate «Сохранить», so a click outside can never
 * silently throw a choice away. The trigger names the active value: «Цвет: Чёрный».
 */
export default function FilterDropdown({ label, options, value, onApply }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const choose = (next: string) => {
    onApply(next === value ? '' : next)
    setIsOpen(false)
  }

  const isActive = value !== ''
  const activeLabel = options.find((option) => option.value === value)?.label ?? value

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        whileTap={{ scale: 0.95 }}
        className={`flex h-14 max-w-72 items-center gap-2 rounded-pill border-2 px-5 font-grotesk text-sm font-bold transition ${
          isActive
            ? 'border-black bg-black text-white hover:bg-bubblegum-dark'
            : 'border-black bg-white text-ink hover:bg-bubblegum-dark hover:text-white'
        }`}
      >
        <span className="truncate">{isActive ? `${label}: ${activeLabel}` : label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{ transformOrigin: 'top left' }}
          className="absolute left-0 top-full z-30 mt-2 flex max-h-80 w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000]"
        >
          <div className="flex-1 overflow-y-auto p-2">
            {isActive && (
              <button
                type="button"
                onClick={() => choose('')}
                className="w-full rounded-pill px-3 py-2.5 text-left font-grotesk text-sm font-bold text-ink/50 transition hover:bg-silver hover:text-ink"
              >
                Любой
              </button>
            )}
            {options.map((option) => {
              const isSelected = value === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => choose(option.value)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-pill px-3 py-2.5 text-left font-grotesk text-sm font-bold transition ${
                    isSelected ? 'bg-ink text-white' : 'text-ink hover:bg-silver'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
