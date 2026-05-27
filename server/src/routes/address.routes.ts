import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { addressSchema, updateAddressSchema } from '../types/schemas'
import { AddressController } from '../controllers/AddressController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use(authenticate)

router.get('/', AddressController.list)
router.get('/:id', AddressController.getById)
router.post('/', validate(addressSchema), AddressController.create)
router.put('/:id', validate(updateAddressSchema), AddressController.update)
router.delete('/:id', AddressController.delete)
router.put('/:id/default', AddressController.setDefault)

export default router
