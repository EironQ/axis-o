import { Router } from 'express'
import { SettingsController } from '../controllers/SettingsController'
import { adminAuthenticate } from '../middleware/auth'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(adminAuthenticate)

router.get('/', SettingsController.getAll)
router.put('/', SettingsController.update)

router.post('/test-email', SettingsController.testEmail)
router.get('/email-health', SettingsController.checkEmailHealth)

export default router