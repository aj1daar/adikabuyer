import { useEffect, useRef, useState } from 'react'

type CityDropdownProps = {
  cities: readonly string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export default function CityDropdown({ cities, value, onChange, placeholder }: CityDropdownProps) {
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

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  const selectCity = (city: string) => {
    onChange(city)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded-pill border-2 border-black bg-white px-4 py-2 font-grotesk text-base font-semibold text-ink transition outline-none sm:text-sm focus:border-bubblegum-dark"
      >
        <span className={value ? 'text-ink' : 'text-ink/40'}>{value || placeholder}</span>
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
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border-2 border-black bg-white p-2 shadow-[6px_6px_0_0_#000]">
          {cities.map((city) => {
            const isSelected = value === city
            return (
              <button
                key={city}
                type="button"
                onClick={() => selectCity(city)}
                aria-pressed={isSelected}
                className={`w-full rounded-pill px-3 py-3 text-left font-grotesk text-sm font-bold transition ${
                  isSelected ? 'bg-ink text-white' : 'text-ink hover:bg-silver'
                }`}
              >
                {city}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
