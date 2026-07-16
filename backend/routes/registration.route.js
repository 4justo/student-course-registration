import { Router } from 'express';
import RegistrationController from '../controllers/registration.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, RegistrationController.list);
router.post('/', requireAuth, RegistrationController.create);
router.delete('/:id', requireAuth, RegistrationController.remove);

export default router;
