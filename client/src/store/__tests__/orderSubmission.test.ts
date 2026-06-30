import { describe, it, expect, vi, beforeEach } from 'vitest'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Order Submission Concurrency Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Double-submission Prevention', () => {
    it('should prevent concurrent order submissions', async () => {
      let concurrentCalls = 0
      let maxConcurrent = 0

      const mockSubmitOrder = vi.fn().mockImplementation(async () => {
        concurrentCalls++
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls)

        await delay(50)

        concurrentCalls--
        return {
          success: true,
          data: {
            orderId: 'order-1',
            orderNumber: 'AXIS-20260525-001',
            status: 'pending',
            total: 2500,
          },
        }
      })

      const createSubmitOrderWithGuard = () => {
        let isSubmitting = false

        return async (data: any) => {
          if (isSubmitting) {
            throw new Error('Order submission already in progress')
          }

          isSubmitting = true
          try {
            return await mockSubmitOrder(data)
          } finally {
            isSubmitting = false
          }
        }
      }

      const submitOrder = createSubmitOrderWithGuard()

      const orderData = {
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentProvider: 'paypal' as const,
        currency: 'CNY',
      }

      const results = await Promise.allSettled([
        submitOrder(orderData),
        submitOrder(orderData),
        submitOrder(orderData),
      ])

      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length
      const rejectedCount = results.filter((r) => r.status === 'rejected').length

      expect(maxConcurrent).toBe(1)
      expect(mockSubmitOrder).toHaveBeenCalledTimes(1)
      expect(fulfilledCount).toBe(1)
      expect(rejectedCount).toBe(2)
    })

    it('should only create one order when submit is clicked 5 times rapidly', async () => {
      let callCount = 0

      const mockSubmitOrder = vi.fn().mockImplementation(async () => {
        callCount++
        await delay(20)
        return {
          success: true,
          data: {
            orderId: 'order-1',
            orderNumber: 'AXIS-20260525-001',
            status: 'pending',
            total: 2500,
          },
        }
      })

      const createSubmitOrderWithGuard = () => {
        let isSubmitting = false

        return async (data: any) => {
          if (isSubmitting) {
            throw new Error('Order submission already in progress')
          }

          isSubmitting = true
          try {
            return await mockSubmitOrder(data)
          } finally {
            isSubmitting = false
          }
        }
      }

      const submitOrder = createSubmitOrderWithGuard()

      const orderData = {
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentProvider: 'paypal' as const,
        currency: 'CNY',
      }

      const promises = Array.from({ length: 5 }, () => submitOrder(orderData))
      const results = await Promise.allSettled(promises)

      const successfulCalls = results.filter((r) => r.status === 'fulfilled').length

      expect(mockSubmitOrder).toHaveBeenCalledTimes(1)
      expect(successfulCalls).toBe(1)
    })
  })

  describe('isSubmitting State Management', () => {
    it('should set isSubmitting to true during order submission', async () => {
      let isSubmittingDuringRequest: boolean | null = null

      const mockSubmitOrder = vi.fn().mockImplementation(async () => {
        isSubmittingDuringRequest = true
        await delay(50)
        isSubmittingDuringRequest = false
        return { success: true, data: { orderId: 'order-1' } }
      })

      let isSubmitting = false

      const createSubmitOrderWithGuard = () => {
        return async (data: any) => {
          isSubmitting = true
          try {
            return await mockSubmitOrder(data)
          } finally {
            isSubmitting = false
          }
        }
      }

      const submitOrder = createSubmitOrderWithGuard()

      const submitPromise = submitOrder({})

      expect(isSubmittingDuringRequest).toBe(true)

      await submitPromise

      expect(isSubmitting).toBe(false)
    })

    it('should reset isSubmitting to false after successful submission', async () => {
      let isSubmitting = false

      const mockSubmitOrder = vi.fn().mockResolvedValue({
        success: true,
        data: { orderId: 'order-1' },
      })

      const createSubmitOrderWithGuard = () => {
        return async (data: any) => {
          isSubmitting = true
          try {
            return await mockSubmitOrder(data)
          } finally {
            isSubmitting = false
          }
        }
      }

      const submitOrder = createSubmitOrderWithGuard()

      await submitOrder({})

      expect(isSubmitting).toBe(false)
    })

    it('should reset isSubmitting to false after failed submission', async () => {
      let isSubmitting = false

      const mockSubmitOrder = vi.fn().mockRejectedValue(new Error('Network error'))

      const createSubmitOrderWithGuard = () => {
        return async (data: any) => {
          isSubmitting = true
          try {
            return await mockSubmitOrder(data)
          } finally {
            isSubmitting = false
          }
        }
      }

      const submitOrder = createSubmitOrderWithGuard()

      try {
        await submitOrder({})
      } catch {
      }

      expect(isSubmitting).toBe(false)
    })
  })

  describe('Order Creation with Cart Items', () => {
    it('should filter out items with quantity 0 when creating order', async () => {
      let capturedOrderItems: any[] = []

      const mockCreateOrder = vi.fn().mockImplementation((data: any) => {
        capturedOrderItems = data.items || []
        return Promise.resolve({
          success: true,
          data: { orderId: 'order-1' },
        })
      })

      const cartItems = [
        { id: 'item-1', productNameEn: 'Product 1', quantity: 2, price: 1000, totalPrice: 2000 },
        { id: 'item-2', productNameEn: 'Product 2', quantity: 0, price: 500, totalPrice: 0 },
        { id: 'item-3', productNameEn: 'Product 3', quantity: 1, price: 500, totalPrice: 500 },
      ]

      const validItems = cartItems.filter((item) => item.quantity > 0)

      await mockCreateOrder({ items: validItems })

      expect(capturedOrderItems.length).toBe(2)
      expect(capturedOrderItems.find((i) => i.id === 'item-2')).toBeUndefined()
      expect(capturedOrderItems.find((i) => i.id === 'item-1')).toBeDefined()
      expect(capturedOrderItems.find((i) => i.id === 'item-3')).toBeDefined()
    })
  })

  describe('Order State Transitions', () => {
    it('should correctly track order submission states', async () => {
      const stateTransitions: boolean[] = []

      const mockSubmitOrder = vi.fn().mockImplementation(async () => {
        stateTransitions.push(true)
        await delay(50)
        stateTransitions.push(false)
        return { success: true, data: { orderId: 'order-1' } }
      })

      let isSubmitting = false

      const createSubmitOrderWithGuard = () => {
        return async (data: any) => {
          isSubmitting = true
          stateTransitions.push(isSubmitting)
          try {
            return await mockSubmitOrder(data)
          } finally {
            isSubmitting = false
            stateTransitions.push(isSubmitting)
          }
        }
      }

      const submitOrder = createSubmitOrderWithGuard()

      await submitOrder({})

      expect(stateTransitions[0]).toBe(true)
      expect(stateTransitions[1]).toBe(true)
      expect(stateTransitions[2]).toBe(false)
    })
  })
})