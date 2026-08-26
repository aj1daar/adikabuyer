import { create } from 'zustand'

export type OriginRect = { top: number; left: number; width: number; height: number }
export type TransitionPhase = 'expand' | 'collapse' | null

type CardTransitionStore = {
  originRect: OriginRect | null
  phase: TransitionPhase
  play: (phase: NonNullable<TransitionPhase>, rect?: OriginRect) => void
  clear: () => void
}

const useCardTransitionStore = create<CardTransitionStore>()((set) => ({
  originRect: null,
  phase: null,
  play: (phase, rect) =>
    set((state) => ({ phase, originRect: rect ?? state.originRect })),
  clear: () => set({ phase: null }),
}))

export default useCardTransitionStore
