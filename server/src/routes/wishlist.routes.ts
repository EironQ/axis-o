import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { WishlistController } from '../controllers/WishlistController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(authenticate)

router.get('/', WishlistController.list)
router.get('/product/:productId', WishlistController.checkProduct)
router.post('/items', WishlistController.addItem)
router.delete('/items/:id', WishlistController.removeItem)
router.delete('/product/:productId', WishlistController.removeByProduct)
router.delete('/', WishlistController.clear)

export default router
