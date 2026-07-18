import { Router } from 'express';
import CourseController from '../controllers/course.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, CourseController.list);
router.post('/', requireAuth, requireAdmin, CourseController.create);
router.delete('/:id', requireAuth, requireAdmin, CourseController.remove);

export default router;
