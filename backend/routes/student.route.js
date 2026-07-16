import { Router } from 'express';
import StudentController from '../controllers/student.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, StudentController.list);
router.post('/', requireAuth, StudentController.create);

export default router;
