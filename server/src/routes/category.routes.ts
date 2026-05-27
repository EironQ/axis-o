import { Router } from 'express'
import { CategoryController } from '../controllers/CategoryController'
import { adminAuthenticate } from '../middleware/auth'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.get('/', CategoryController.list)
router.get('/:id', CategoryController.getById)

router.use(adminAuthenticate)

router.post('/', CategoryController.create)
router.put('/:id', CategoryController.update)
router.delete('/:id', CategoryController.delete)
router.patch('/:id/status', CategoryController.toggleStatus)

export default router