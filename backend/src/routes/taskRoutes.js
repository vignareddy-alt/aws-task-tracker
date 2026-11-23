import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
  validateStatusUpdate,
  validateTaskQuery,
} from '../middleware/validateTask.js';

const router = Router();

// Each route runs its validator first, then the controller.
router.get('/', validateTaskQuery, taskController.getTasks);
// "/stats" must be declared before "/:id", otherwise "stats" would be treated as an id.
router.get('/stats', taskController.getTaskStats);
router.get('/:id', validateTaskId, taskController.getTask);
router.post('/', validateCreateTask, taskController.createTask);
router.put('/:id', validateTaskId, validateUpdateTask, taskController.updateTask);
router.patch('/:id/status', validateTaskId, validateStatusUpdate, taskController.updateTaskStatus);
router.delete('/:id', validateTaskId, taskController.deleteTask);

export default router;
