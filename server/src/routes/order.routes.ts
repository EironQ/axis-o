import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createOrderSchema } from '../types/schemas'
import { OrderController } from '../controllers/OrderController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(authenticate)

router.get('/', OrderController.list)
router.get('/:id', OrderController.getById)
router.post('/', validate(createOrderSchema), OrderController.create)
router.put('/:id/cancel', OrderController.cancel)
router.put('/:id/confirm-delivery', OrderController.confirmDelivery)

export default router
