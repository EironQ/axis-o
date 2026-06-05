import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from '../utils/uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const productUploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products')
const bannerUploadsDir = path.join(__dirname, '..', '..', 'uploads', 'banners')

if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true })
}

if (!fs.existsSync(bannerUploadsDir)) {
  fs.mkdirSync(bannerUploadsDir, { recursive: true })
}

const createStorage = (destination: string) => {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      const name = `${uuidv4()}${ext}`
      cb(null, name)
    },
  })
}

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, GIF, WebP, SVG and ICO images are allowed'))
  }
}

export const productImageUpload = multer({
  storage: createStorage(productUploadsDir),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
})

export const bannerImageUpload = multer({
  storage: createStorage(bannerUploadsDir),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
})
