import { Router } from 'express'
import { validate } from '../middleware/validate'
import { authLimiter } from '../middleware/rateLimiter'
import { authenticate } from '../middleware/auth'
import { registerSchema, loginSchema } from '../types/schemas'
import { UserController } from '../controllers/UserController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.post('/register', authLimiter, validate(registerSchema), UserController.register)
router.post('/login', authLimiter, validate(loginSchema), UserController.login)
router.post('/refresh-token', UserController.refreshToken)

router.use(authenticate)

router.get('/profile', UserController.getProfile)
router.put('/profile', UserController.updateProfile)
router.put('/change-password', UserController.changePassword)

export default router
