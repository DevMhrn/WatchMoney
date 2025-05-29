import { signupUser, signinUser } from '../controllers/authControllers.js';
import express from 'express';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/signin', signinUser);

export default router;