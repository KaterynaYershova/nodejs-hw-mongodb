import express from 'express';
import { register, login, refresh, logoutUserController, refreshUserSessionController } from '../controllers/auth.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../middlewares/validateBody.js';
import { registerSchema, loginSchema } from '../models/validationSchemas.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', ctrlWrapper(refreshUserSessionController));
router.post('/logout', ctrlWrapper(logoutUserController));

export default router;
