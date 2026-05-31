import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { PaymentController } from '../controllers/PaymentController'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.get('/intent/:orderId', authenticate, PaymentController.createPaymentIntent)
router.post('/webhook', PaymentController.handleWebhook)
router.post('/paypal/capture', authenticate, PaymentController.capturePayPalOrder)
router.post('/paypal/webhook', PaymentController.handlePayPalWebhook)
router.post('/airwallex/notify', PaymentController.handleAirwallexNotify)
router.post('/sync-status', authenticate, PaymentController.syncPaymentStatus)
router.post('/refund/:orderId', authenticate, PaymentController.createRefund)

export default router
