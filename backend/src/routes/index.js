// Combines all route modules under the /api prefix (mounted in app.js).
import { Router } from 'express';
import taskRoutes from './taskRoutes.js';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/health', getHealth);
router.use('/tasks', taskRoutes);

export default router;
