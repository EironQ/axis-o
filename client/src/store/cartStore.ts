import { create } from 'zustand'
import { cartApi, CartItemResponse, CartResponse } from '@/services/api'

export interface CartItem extends CartItemResponse {}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isLoading: boolean
  error: string | null
  isOpen: boolean
  isUpdating: boolean
  pendingUpdates: Map<string, number>
  fetchCart: () => Promise<void>
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  toggleCart: () => void
  closeCart: () => void
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
  isOpen: false,
  isUpdating: false,
  pendingUpdates: new Map(),

  fetchCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await cartApi.getCart()
      if (response.success) {
        set({
          items: response.data.items,
          totalItems: response.data.totalItems,
          totalPrice: response.data.totalPrice,
        })
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      set({ error: 'Failed to fetch cart' })
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (variantId, quantity = 1) => {
    if (get().isUpdating) {
      return
    }
    set({ isUpdating: true })
    try {
      await cartApi.addItem({ variantId, quantity })
      await get().fetchCart()
      set({ isOpen: true })
    } catch (error) {
      console.error('Failed to add item:', error)
      set({ error: 'Failed to add item to cart' })
    } finally {
      set({ isUpdating: false })
    }
  },

  updateItem: async (itemId, quantity) => {
    const state = get()
    
    if (state.isUpdating && !state.pendingUpdates.has(itemId)) {
      state.pendingUpdates.set(itemId, quantity)
      return
    }

    if (quantity < 1) {
      await get().removeItem(itemId)
      return
    }

    set({ isUpdating: true })
    try {
      await cartApi.updateItem(itemId, { quantity })
      await get().fetchCart()
      
      const pending = get().pendingUpdates
      if (pending.has(itemId)) {
        const pendingQty = pending.get(itemId)!
        pending.delete(itemId)
        await get().updateItem(itemId, pendingQty)
      }
    } catch (error) {
      console.error('Failed to update item:', error)
      set({ error: 'Failed to update cart item' })
    } finally {
      set({ isUpdating: false })
    }
  },

  removeItem: async (itemId) => {
    if (get().isUpdating) {
      return
    }
    set({ isUpdating: true })
    try {
      await cartApi.removeItem(itemId)
      await get().fetchCart()
    } catch (error) {
      console.error('Failed to remove item:', error)
      set({ error: 'Failed to remove cart item' })
    } finally {
      set({ isUpdating: false })
    }
  },

  clearCart: async () => {
    if (get().isUpdating) {
      return
    }
    set({ isUpdating: true })
    try {
      await cartApi.clearCart()
      set({ items: [], totalItems: 0, totalPrice: 0 })
    } catch (error) {
      console.error('Failed to clear cart:', error)
      set({ error: 'Failed to clear cart' })
    } finally {
      set({ isUpdating: false })
    }
  },

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  closeCart: () => set({ isOpen: false }),

  getItemCount: () => get().totalItems,
}))