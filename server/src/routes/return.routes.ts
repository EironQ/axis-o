import { Router } from 'express'
import { ReturnController } from '../controllers/ReturnController'
import { authenticate } from '../middleware/auth'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(authenticate)

router.post('/', ReturnController.create)
router.get('/', ReturnController.list)
router.get('/:id', ReturnController.getById)
router.get('/order/:orderId', ReturnController.getByOrderId)
router.patch('/:id/cancel', ReturnController.cancel)

export default router