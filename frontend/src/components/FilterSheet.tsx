import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useFilterSheetStore from '../store/useFilterSheetStore'
import { SINGLE_SELECT_FILTERS, type FilterOption } from '../utils/attributeOptions'

type AccordionSectionProps = {
  title: string
  summary: string | null
  isOpen: boolean
  onToggleOpen: () => void
  children: ReactNode
}

function AccordionSection({ title, summary, isOpen, onToggleOpen, children }: AccordionSectionProps) {
  return (
    <div className="border-b-2 border-black/10 last:border-b-0">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 py-4 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className="font-grotesk text-sm font-bold text-ink">{title}</span>
          {summary && <span className="font-grotesk text-xs font-bold text-bubblegum-dark">{summary}</span>}
        </span>
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
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="pb-4"
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

type OptionListProps = {
  options: FilterOption[]
  value: string
  onToggle: (value: string) => void
}

function OptionList({ options, value, onToggle }: OptionListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            aria-pressed={isSelected}
            className={`rounded-pill border-2 border-black px-4 py-2 font-grotesk text-sm font-bold transition ${
              isSelected ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-silver'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

type FilterSheetProps = {
  category: string
  color: string
  size: string
  volumeMin: string
  volumeMax: string
  categoryOptions: FilterOption[]
  onCategoryChange: (value: string) => void
  onColorChange: (value: string) => void
  onSizeChange: (value: string) => void
  onVolumeChange: (min: string, max: string) => void
}

export default function FilterSheet({
  category,
  color,
  size,
  volumeMin,
  volumeMax,
  categoryOptions,
  onCategoryChange,
  onColorChange,
  onSizeChange,
  onVolumeChange,
}: FilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [draftCategory, setDraftCategory] = useState(category)
  const [draftColor, setDraftColor] = useState(color)
  const [draftSize, setDraftSize] = useState(size)
  const [draftVolumeMin, setDraftVolumeMin] = useState(volumeMin)
  const [draftVolumeMax, setDraftVolumeMax] = useState(volumeMax)

  const openSheet = useFilterSheetStore((state) => state.open)
  const closeSheet = useFilterSheetStore((state) => state.close)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const activeCount = [category, color, size, volumeMin || volumeMax].filter(Boolean).length

  const handleOpen = () => {
    setDraftCategory(category)
    setDraftColor(color)
    setDraftSize(size)
    setDraftVolumeMin(volumeMin)
    setDraftVolumeMax(volumeMax)
    setOpenSection(null)
    openSheet()
    setIsOpen(true)
  }

  const handleClose = () => {
    closeSheet()
    setIsOpen(false)
  }

  const handleReset = () => {
    setDraftCategory('')
    setDraftColor('')
    setDraftSize('')
    setDraftVolumeMin('')
    setDraftVolumeMax('')
  }

  const handleApply = () => {
    onCategoryChange(draftCategory)
    onColorChange(draftColor)
    onSizeChange(draftSize)
    onVolumeChange(draftVolumeMin, draftVolumeMax)
    handleClose()
  }

  const toggleValue = (current: string, setter: (value: string) => void, value: string) => {
    setter(current === value ? '' : value)
  }

  const toggleSection = (key: string) => {
    setOpenSection((current) => (current === key ? null : key))
  }

  const volumeSummary =
    draftVolumeMin || draftVolumeMax ? `${draftVolumeMin || '0'}–${draftVolumeMax || '∞'} мл` : null

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={handleOpen}
        className={`flex h-14 items-center gap-2 rounded-pill border-2 px-5 font-grotesk text-sm font-bold transition ${
          activeCount > 0
            ? 'border-black bg-black text-white hover:bg-bubblegum-dark'
            : 'border-black bg-white text-ink hover:bg-bubblegum hover:text-white'
        }`}
      >
        Фильтры{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="filter-sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-40 bg-ink/40"
            />
            <motion.div
              key="filter-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              role="dialog"
              aria-label="Фильтры"
              className="fixed inset-x-0 bottom-0 z-50 flex h-[70dvh] flex-col rounded-t-3xl border-2 border-black bg-white shadow-[0_-8px_0_0_#000]"
            >
              <div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
                <h2 className="font-grotesk text-lg font-bold text-ink">Фильтры</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="-m-3 p-3 font-grotesk text-sm font-bold text-ink/50 transition hover:text-ink"
                >
                  Закрыть
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-6">
                {categoryOptions.length > 0 && (
                  <AccordionSection
                    title="Категория"
                    summary={draftCategory || null}
                    isOpen={openSection === 'category'}
                    onToggleOpen={() => toggleSection('category')}
                  >
                    <OptionList
                      options={categoryOptions}
                      value={draftCategory}
                      onToggle={(value) => toggleValue(draftCategory, setDraftCategory, value)}
                    />
                  </AccordionSection>
                )}
                {SINGLE_SELECT_FILTERS.map(({ key, label, options }) => {
                  const draftValue = key === 'color' ? draftColor : draftSize
                  const setDraftValue = key === 'color' ? setDraftColor : setDraftSize
                  return (
                    <AccordionSection
                      key={key}
                      title={label}
                      summary={draftValue || null}
                      isOpen={openSection === key}
                      onToggleOpen={() => toggleSection(key)}
                    >
                      <OptionList
                        options={options}
                        value={draftValue}
                        onToggle={(value) => toggleValue(draftValue, setDraftValue, value)}
                      />
                    </AccordionSection>
                  )
                })}
                <AccordionSection
                  title="Объём"
                  summary={volumeSummary}
                  isOpen={openSection === 'volume'}
                  onToggleOpen={() => toggleSection('volume')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={draftVolumeMin}
                      onChange={(event) => setDraftVolumeMin(event.target.value)}
                      placeholder="От"
                      className="w-1/2 rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold text-ink outline-none focus:border-bubblegum-dark"
                    />
                    <input
                      type="number"
                      min={0}
                      value={draftVolumeMax}
                      onChange={(event) => setDraftVolumeMax(event.target.value)}
                      placeholder="До"
                      className="w-1/2 rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold text-ink outline-none focus:border-bubblegum-dark"
                    />
                    <span className="shrink-0 font-grotesk text-xs font-bold text-ink/50">мл</span>
                  </div>
                </AccordionSection>
              </div>

              <div className="flex items-center justify-between gap-2 border-t-2 border-black px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 whitespace-nowrap rounded-pill px-3 py-2 font-grotesk text-sm font-bold text-ink/50 transition hover:text-ink"
                >
                  Сбросить
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 rounded-pill border-2 border-black bg-ink px-4 py-3 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark"
                >
                  Показать товары
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
