import { Router, Request, Response } from 'express'
import { adminAuthenticate } from '../middleware/auth'
import { productImageUpload } from '../middleware/upload'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(adminAuthenticate)

router.post(
  '/products',
  productImageUpload.array('images', 10),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: { code: 'NO_FILES', message: 'No image files uploaded' } })
      return
    }

    const urls = files.map((file) => `/uploads/products/${file.filename}`)

    res.json({
      success: true,
      data: { urls },
    })
  }
)

export default router
