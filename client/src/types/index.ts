export interface ProductColor {
  name: string
  hex: string
  imageIndex: number
}

export interface DetailImage {
  image: string
  title: string
  description: string
}

export interface Product {
  id: string
  name: string
  series: 'classic' | 'luxe' | 'travel'
  description: string
  price: number
  colors: ProductColor[]
  sizes: string[]
  material: string
  images: string[]
  story: string
  isBestSeller: boolean
  category: string
  detailImages?: DetailImage[]
  slug?: string
  nameEn?: string
  nameZh?: string
  descriptionEn?: string
  descriptionZh?: string
  storyEn?: string
  storyZh?: string
  isActive?: boolean
  sortOrder?: number
  metaTitleEn?: string | null
  metaTitleZh?: string | null
  metaDescriptionEn?: string | null
  metaDescriptionZh?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CartItem {
  productId: string
  colorName: string
  size: string
  quantity: number
}

export interface CollectionCard {
  id: string
  title: string
  subtitle: string
  image: string
  link: string
  series: string
}
