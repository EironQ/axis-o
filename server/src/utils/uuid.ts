import { v4 as generateUUID } from 'uuid'

export function v4(): string {
  return generateUUID()
}

export function generateOrderNumber(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `AX-${y}${m}${d}-${rand}`
}
