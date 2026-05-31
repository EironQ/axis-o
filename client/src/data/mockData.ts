import { products } from './products'

export const IMG = (prompt: string, size = 'square_hd') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

export interface MockCartItem {
  id: string
  variantId: string
  productId: string
  productNameEn: string
  productName: string
  colorName: string
  colorHex: string
  size: string
  price: number
  quantity: number
  image: string
}

export interface MockOrder {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
  items: MockOrderItem[]
  subtotal: number
  shipping: number
  taxAmount: number
  discountAmount: number
  total: number
  shippingAddress: MockAddress
  billingAddress: MockAddress
  paymentMethod: 'stripe' | 'paypal' | 'airwallex'
  trackingNumber?: string
  note?: string
}

export interface MockOrderItem {
  id: string
  productId: string
  productNameEn: string
  productName: string
  colorName: string
  colorHex: string
  size: string
  price: number
  quantity: number
  image: string
}

export interface MockAddress {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  street: string
  postalCode: string
  isDefault: boolean
}

export const mockAddresses: MockAddress[] = [
  {
    id: 'addr-001',
    name: '张小美',
    phone: '138****5520',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    street: '陆家嘴环路1000号汇添富大厦18层',
    postalCode: '200120',
    isDefault: true,
  },
  {
    id: 'addr-002',
    name: '张小美',
    phone: '139****8847',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    street: '文二路391号西湖国际科技大厦',
    postalCode: '310012',
    isDefault: false,
  },
]

export const mockCartItems: MockCartItem[] = [
  {
    id: 'cart-001',
    variantId: 'classic-tote-01-焦糖棕-大号',
    productId: 'classic-tote-01',
    productNameEn: 'Amelia',
    productName: 'Amelia 经典托特包',
    colorName: '焦糖棕',
    colorHex: '#C89460',
    size: '大号',
    price: 1880,
    quantity: 1,
    image: IMG('caramel brown leather tote bag, rich warm tone, sophisticated minimalist design, soft lighting, premium fashion photography'),
  },
  {
    id: 'cart-002',
    variantId: 'classic-crossbody-01-橄榄绿-标准',
    productId: 'classic-crossbody-01',
    productNameEn: 'Clara',
    productName: 'Clara 斜挎包',
    colorName: '橄榄绿',
    colorHex: '#6B705C',
    size: '标准',
    price: 1480,
    quantity: 2,
    image: IMG('olive green leather crossbody bag, sophisticated muted tone, elegant minimalist design, premium fashion photography, natural aesthetic'),
  },
  {
    id: 'cart-003',
    variantId: 'luxe-chain-01-酒红-标准',
    productId: 'luxe-chain-01',
    productNameEn: 'Celeste',
    productName: 'Celeste 链条包',
    colorName: '酒红',
    colorHex: '#722F37',
    size: '标准',
    price: 3280,
    quantity: 1,
    image: IMG('burgundy red luxury chain bag, gold chain accent, deep rich wine color, elegant evening accessory, premium fashion photography'),
  },
]

export const mockOrders: MockOrder[] = [
  {
    id: 'order-001',
    orderNumber: 'AXIS-20240115-001',
    status: 'delivered',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    subtotal: 4860,
    shipping: 0,
    taxAmount: 388.8,
    discountAmount: 0,
    total: 5248.8,
    paymentMethod: 'stripe',
    trackingNumber: 'SF1234567890',
    shippingAddress: mockAddresses[0],
    billingAddress: mockAddresses[0],
    items: [
      {
        id: 'item-001',
        productId: 'classic-tote-01',
        productNameEn: 'Amelia',
        productName: 'Amelia 经典托特包',
        colorName: '焦糖棕',
        colorHex: '#C89460',
        size: '大号',
        price: 1880,
        quantity: 1,
        image: IMG('caramel brown leather tote bag, rich warm tone, sophisticated minimalist design, soft lighting, premium fashion photography'),
      },
      {
        id: 'item-002',
        productId: 'classic-wallet-01',
        productNameEn: 'Elena',
        productName: 'Elena 长款钱包',
        colorName: '焦糖棕',
        colorHex: '#C89460',
        size: '标准',
        price: 1280,
        quantity: 1,
        image: IMG('caramel brown slim leather long wallet, elegant minimalist design, premium Italian leather, soft warm lighting, luxury accessory product shot'),
      },
    ],
  },
  {
    id: 'order-002',
    orderNumber: 'AXIS-20240120-002',
    status: 'shipped',
    createdAt: '2024-01-20T15:45:00Z',
    updatedAt: '2024-01-22T09:00:00Z',
    subtotal: 3280,
    shipping: 0,
    taxAmount: 262.4,
    discountAmount: 0,
    total: 3542.4,
    paymentMethod: 'airwallex',
    trackingNumber: 'SF9876543210',
    shippingAddress: mockAddresses[1],
    billingAddress: mockAddresses[1],
    items: [
      {
        id: 'item-003',
        productId: 'luxe-chain-01',
        productNameEn: 'Celeste',
        productName: 'Celeste 链条包',
        colorName: '酒红',
        colorHex: '#722F37',
        size: '标准',
        price: 3280,
        quantity: 1,
        image: IMG('burgundy red luxury chain bag, gold chain accent, deep rich wine color, elegant evening accessory, premium fashion photography'),
      },
    ],
  },
  {
    id: 'order-003',
    orderNumber: 'AXIS-20240125-003',
    status: 'processing',
    createdAt: '2024-01-25T11:20:00Z',
    updatedAt: '2024-01-25T11:20:00Z',
    subtotal: 3360,
    shipping: 50,
    taxAmount: 268.8,
    discountAmount: 0,
    total: 3678.8,
    paymentMethod: 'paypal',
    shippingAddress: mockAddresses[0],
    billingAddress: mockAddresses[0],
    items: [
      {
        id: 'item-004',
        productId: 'classic-crossbody-01',
        productNameEn: 'Clara',
        productName: 'Clara 斜挎包',
        colorName: '橄榄绿',
        colorHex: '#6B705C',
        size: '标准',
        price: 1480,
        quantity: 2,
        image: IMG('olive green leather crossbody bag, sophisticated muted tone, elegant minimalist design, premium fashion photography, natural aesthetic'),
      },
      {
        id: 'item-005',
        productId: 'travel-cosmetic-01',
        productNameEn: 'Iris',
        productName: 'Iris 化妆包',
        colorName: '陶土色',
        colorHex: '#C17E60',
        size: '标准',
        price: 980,
        quantity: 1,
        image: IMG('terracotta orange leather cosmetic pouch, elegant compact design, premium materials, soft studio lighting, luxury accessory photography'),
      },
    ],
  },
  {
    id: 'order-004',
    orderNumber: 'AXIS-20240128-004',
    status: 'pending',
    createdAt: '2024-01-28T09:15:00Z',
    updatedAt: '2024-01-28T09:15:00Z',
    subtotal: 6640,
    shipping: 0,
    taxAmount: 531.2,
    discountAmount: 0,
    total: 7171.2,
    paymentMethod: 'stripe',
    shippingAddress: mockAddresses[0],
    billingAddress: mockAddresses[0],
    note: '请使用礼盒包装',
    items: [
      {
        id: 'item-006',
        productId: 'luxe-top-handle-01',
        productNameEn: 'Margot',
        productName: 'Margot 手提包',
        colorName: '墨绿',
        colorHex: '#2D4A3E',
        size: '中号',
        price: 5880,
        quantity: 1,
        image: IMG('deep green luxury structured top handle bag, rich emerald tone, architectural design, premium fashion photography, elegant aesthetic'),
      },
      {
        id: 'item-007',
        productId: 'classic-backpack-01',
        productNameEn: 'Luna',
        productName: 'Luna 双肩包',
        colorName: '焦糖棕',
        colorHex: '#C89460',
        size: '标准',
        price: 2580,
        quantity: 1,
        image: IMG('caramel brown leather backpack, sophisticated warm tone, elegant urban design, soft natural light, premium product photography'),
      },
    ],
  },
]

export function getMockCartByUserId(userId: string) {
  return {
    items: mockCartItems,
    totalItems: mockCartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }
}

export function getMockOrdersByUserId(userId: string) {
  return {
    orders: mockOrders,
    total: mockOrders.length,
    page: 1,
    limit: 10,
  }
}

export function getMockOrderById(orderId: string) {
  return mockOrders.find((order) => order.id === orderId)
}

export function createMockOrder(orderData: Partial<MockOrder>): MockOrder {
  const newOrder: MockOrder = {
    id: `order-${Date.now()}`,
    orderNumber: `AXIS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mockOrders.length + 1).padStart(3, '0')}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtotal: orderData.subtotal || 0,
    shipping: orderData.shipping || 0,
    taxAmount: orderData.taxAmount || 0,
    discountAmount: orderData.discountAmount || 0,
    total: orderData.total || 0,
    paymentMethod: orderData.paymentMethod || 'stripe',
    shippingAddress: orderData.shippingAddress || mockAddresses[0],
    billingAddress: orderData.billingAddress || mockAddresses[0],
    items: orderData.items || [],
    note: orderData.note,
  }
  mockOrders.unshift(newOrder)
  return newOrder
}

export function cancelMockOrder(orderId: string): MockOrder | null {
  const order = mockOrders.find((o) => o.id === orderId)
  if (order && order.status === 'pending') {
    order.status = 'cancelled'
    order.updatedAt = new Date().toISOString()
    return order
  }
  return null
}

export function getMockAddresses() {
  return mockAddresses
}