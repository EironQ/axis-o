import { Router } from 'express'
import { validate } from '../middleware/validate'
import { authLimiter } from '../middleware/rateLimiter'
import { adminAuthenticate } from '../middleware/auth'
import { loginSchema, createProductSchema, updateProductSchema, adminProductQuerySchema } from '../types/schemas'
import { AdminController } from '../controllers/AdminController'
import { BannerController } from '../controllers/BannerController'
import { ProductController } from '../controllers/ProductController'
import { OrderController } from '../controllers/OrderController'
import { PaymentController } from '../controllers/PaymentController'
import { UserController } from '../controllers/UserController'
import { ReturnController } from '../controllers/ReturnController'
import { bannerImageUpload } from '../middleware/upload'
import settingsRoutes from './settings.routes'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.post('/login', authLimiter, validate(loginSchema), AdminController.login)
router.post('/refresh-token', AdminController.refreshToken)

router.use(adminAuthenticate)

router.get('/dashboard', AdminController.getDashboard)

router.get('/banners', BannerController.adminList)
router.get('/banners/:id', BannerController.adminGetById)
router.post('/banners', bannerImageUpload.single('image'), BannerController.create)
router.put('/banners/:id', bannerImageUpload.single('image'), BannerController.update)
router.delete('/banners/:id', BannerController.delete)

router.get('/products', validate(adminProductQuerySchema, 'query'), ProductController.adminList)
router.get('/products/:id', ProductController.adminGetById)
router.post('/products', validate(createProductSchema), ProductController.create)
router.put('/products/:id', validate(updateProductSchema), ProductController.update)
router.delete('/products/:id', ProductController.delete)

router.get('/orders', OrderController.adminList)
router.get('/orders/:id', OrderController.adminGetById)
router.patch('/orders/:id/status', OrderController.adminUpdateStatus)
router.post('/orders/:id/refund', OrderController.adminRefund)

router.get('/payments/events', PaymentController.listPaymentEvents)

router.get('/returns', ReturnController.adminList)
router.get('/returns/:id', ReturnController.adminGetById)
router.patch('/returns/:id', ReturnController.adminUpdate)
router.patch('/returns/:id/refund', ReturnController.adminRefund)

router.get('/users', UserController.adminListUsers)
router.get('/users/:id', UserController.adminGetUserById)
router.put('/users/:id', UserController.adminUpdateUser)
router.patch('/users/:id/status', UserController.adminDisableUser)
router.get('/users/:id/orders', UserController.adminGetUserOrders)
router.get('/users/:id/addresses', UserController.adminGetUserAddresses)

router.use('/settings', settingsRoutes)

export default router