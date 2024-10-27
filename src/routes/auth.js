import express from 'express';
import { register, login, refresh, logout } from '../controllers/auth.js';
import { authenticate } from '../middlewares/authenticate.js'; 

const router = express.Router();

router.post('/register', register); 
router.post('/login', login); 
router.post('/refresh', authenticate, refresh);
router.post('/logout', authenticate, logout); 

export default router;
