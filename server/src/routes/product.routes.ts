import { Router } from 'express'
import { validate } from '../middleware/validate'
import { optionalAuth } from '../middleware/auth'
import { paginationSchema } from '../types/schemas'
import { ProductController } from '../controllers/ProductController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.get('/', optionalAuth, validate(paginationSchema, 'query'), ProductController.list)
router.get('/bestsellers', ProductController.getBestsellers)
router.get('/categories', ProductController.getCategories)
router.get('/series', ProductController.getSeries)
router.get('/:id', optionalAuth, ProductController.getById)
router.get('/slug/:slug', optionalAuth, ProductController.getBySlug)

export default router
