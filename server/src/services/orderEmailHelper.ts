import { db } from '../config/database'
import { orders, orderItems, addresses, users, products } from '../db/schema'
import { eq } from 'drizzle-orm'
import { EmailService, OrderEmailData } from './email'

export const OrderEmailHelper = {
  sendOrderConfirmationEmail: async (orderId: string): Promise<boolean> => {
    try {
      const orderResult = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotal: orders.subtotal,
          shippingCost: orders.shippingCost,
          taxAmount: orders.taxAmount,
          discountAmount: orders.discountAmount,
          total: orders.total,
          currency: orders.currency,
          shippingAddressId: orders.shippingAddressId,
          userId: orders.userId,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

      if (orderResult.length === 0) {
        console.error(`Order ${orderId} not found`)
        return false
      }

      const order = orderResult[0]

      const userResult = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1)

      if (userResult.length === 0) {
        console.error(`User ${order.userId} not found for order ${orderId}`)
        return false
      }

      const user = userResult[0]

      const shippingAddressResult = await db
        .select({
          firstName: addresses.firstName,
          lastName: addresses.lastName,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
          country: addresses.country,
          phone: addresses.phone,
        })
        .from(addresses)
        .where(eq(addresses.id, order.shippingAddressId))
        .limit(1)

      if (shippingAddressResult.length === 0) {
        console.error(`Shipping address ${order.shippingAddressId} not found for order ${orderId}`)
        return false
      }

      const shippingAddress = shippingAddressResult[0]

      const itemsResult = await db
        .select({
          productId: orderItems.productId,
          variantDescription: orderItems.variantDescription,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          productNameZh: products.nameZh,
          productNameEn: products.nameEn,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId))

      const items = itemsResult.map((item) => ({
        name: item.productNameZh || item.productNameEn,
        variant: item.variantDescription || '',
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.totalPrice,
      }))

      const emailData: OrderEmailData = {
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        items,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        total: order.total,
        currency: order.currency,
        shippingAddress: {
          ...shippingAddress,
          line2: shippingAddress.line2 || undefined,
          state: shippingAddress.state || '',
          phone: shippingAddress.phone || '',
        },
        createdAt: order.createdAt,
      }

      const result = await EmailService.sendOrderConfirmation(emailData)
      
      if (!result.success) {
        console.error(`[OrderEmailHelper] Failed to send order confirmation email for order ${orderId}: ${result.error}`)
      } else {
        console.log(`[OrderEmailHelper] Order confirmation email sent successfully to ${user.email} for order ${orderId}`)
      }
      
      return result.success
    } catch (error) {
      console.error(`[OrderEmailHelper] Exception sending order confirmation email for order ${orderId}:`, error)
      return false
    }
  },
}
