import { create } from 'zustand'

type FilterSheetStore = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const useFilterSheetStore = create<FilterSheetStore>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

export default useFilterSheetStore
