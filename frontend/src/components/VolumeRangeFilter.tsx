import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import FilterActions from './FilterActions'

type VolumeRangeFilterProps = {
  min: string
  max: string
  onApply: (min: string, max: string) => void
}

export default function VolumeRangeFilter({ min, max, onApply }: VolumeRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draftMin, setDraftMin] = useState(min)
  const [draftMax, setDraftMax] = useState(max)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    // clicking away keeps what was typed (applies it) instead of silently dropping it;
    // Escape is the explicit "never mind"
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (draftMin !== min || draftMax !== max) {
          onApply(draftMin, draftMax)
        }
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
  }, [isOpen, draftMin, draftMax, min, max, onApply])

  const openDropdown = () => {
    setDraftMin(min)
    setDraftMax(max)
    setIsOpen(true)
  }

  const handleReset = () => {
    setDraftMin('')
    setDraftMax('')
  }

  const handleSave = () => {
    onApply(draftMin, draftMax)
    setIsOpen(false)
  }

  const isActive = min !== '' || max !== ''

  const label = isActive ? `Объём: ${min || '0'}–${max || '∞'} мл` : 'Объём'

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        aria-expanded={isOpen}
        whileTap={{ scale: 0.95 }}
        className={`flex h-14 items-center gap-2 rounded-pill border-2 px-5 font-grotesk text-sm font-bold transition ${
          isActive
            ? 'border-black bg-black text-white hover:bg-bubblegum-dark'
            : 'border-black bg-white text-ink hover:bg-bubblegum-dark hover:text-white'
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
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{ transformOrigin: 'top left' }}
          className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000]"
        >
          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleSave()
            }}
          >
            <input
              type="number"
              min={0}
              value={draftMin}
              onChange={(event) => setDraftMin(event.target.value)}
              placeholder="От"
              className="w-1/2 rounded-pill border-2 border-black px-3 py-2 font-grotesk text-sm font-semibold text-ink outline-none focus:border-bubblegum-dark"
            />
            <input
              type="number"
              min={0}
              value={draftMax}
              onChange={(event) => setDraftMax(event.target.value)}
              placeholder="До"
              className="w-1/2 rounded-pill border-2 border-black px-3 py-2 font-grotesk text-sm font-semibold text-ink outline-none focus:border-bubblegum-dark"
            />
            <span className="shrink-0 font-grotesk text-xs font-bold text-ink/50">мл</span>
            {/* lets Enter in either field apply the range */}
            <button type="submit" className="sr-only" tabIndex={-1}>
              Применить
            </button>
          </form>

          <FilterActions onReset={handleReset} onApply={handleSave} />
        </motion.div>
      )}
    </div>
  )
}
