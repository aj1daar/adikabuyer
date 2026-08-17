import { useEffect, useRef, useState } from 'react'

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

export default function FilterDropdown({ label, options, value, onApply }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(value)
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

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  const openDropdown = () => {
    setDraft(value)
    setIsOpen(true)
  }

  const handleReset = () => {
    setDraft('')
  }

  const handleSave = () => {
    onApply(draft)
    setIsOpen(false)
  }

  const isActive = value !== ''

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        aria-expanded={isOpen}
        className={`flex h-14 items-center gap-2 rounded-pill border-2 px-5 font-grotesk text-sm font-bold transition ${
          isActive
            ? 'border-black bg-black text-white hover:bg-bubblegum-dark'
            : 'border-black bg-white text-ink hover:bg-bubblegum hover:text-white'
        }`}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 flex max-h-80 w-64 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000]">
          <div className="flex-1 overflow-y-auto p-2">
            {options.map((option) => {
              const isSelected = draft === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraft(isSelected ? '' : option.value)}
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

          <div className="flex items-center justify-between gap-2 border-t-2 border-black p-3">
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 whitespace-nowrap rounded-pill px-3 py-2 font-grotesk text-sm font-bold text-ink/50 transition hover:text-ink"
            >
              Сбросить
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="shrink-0 whitespace-nowrap rounded-pill border-2 border-black bg-ink px-4 py-2 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
