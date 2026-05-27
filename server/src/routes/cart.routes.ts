import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { cartItemSchema, updateCartItemSchema } from '../types/schemas'
import { CartController } from '../controllers/CartController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(authenticate)

router.get('/', CartController.getCart)
router.post('/items', validate(cartItemSchema), CartController.addItem)
router.patch('/items/:id', validate(updateCartItemSchema), CartController.updateItem)
router.delete('/items/:id', CartController.removeItem)
router.delete('/', CartController.clearCart)

export default router
