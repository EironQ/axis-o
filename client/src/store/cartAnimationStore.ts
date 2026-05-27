import { create } from 'zustand'

interface CartAnimationState {
  isAnimating: boolean
  cartIconRef: React.RefObject<HTMLAnchorElement> | null
  setCartIconRef: (ref: React.RefObject<HTMLAnchorElement>) => void
  completeAnimation: () => void
}

export const useCartAnimationStore = create<CartAnimationState>((set) => ({
  isAnimating: false,
  cartIconRef: null,
  setCartIconRef: (ref) => set({ cartIconRef: ref }),
  completeAnimation: () => set({ isAnimating: false }),
}))
