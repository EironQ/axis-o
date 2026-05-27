import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { reviewSchema } from '../types/schemas'
import { ReviewController } from '../controllers/ReviewController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.get('/', ReviewController.list)
router.get('/:id', ReviewController.getById)
router.get('/product/:productId/stats', ReviewController.getProductStats)

router.use(authenticate)

router.post('/', validate(reviewSchema), ReviewController.create)
router.put('/:id', validate(reviewSchema), ReviewController.update)
router.delete('/:id', ReviewController.delete)

export default router
