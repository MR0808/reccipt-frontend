import express from 'express';

import * as authController from '../controllers/auth.js';
import * as validators from '../validators/auth.js';
import * as sanitizers from '../sanitizers/auth.js';

const router = express.Router();

router.get('/login', authController.getLogin);

// router.get('/signup', authController.getSignup);

router.post(
    '/login',
    ...validators.login,
    ...sanitizers.signup,
    authController.postLogin
);

// router.post(
//     '/signup',
//     ...validators.signup,
//     ...sanitizers.signup,
//     authController.postSignup
// );

router.post('/logout', authController.postLogout);

// router.get('/reset', authController.getReset);

// router.post('/reset', authController.postReset);

// router.get('/reset/:token', authController.getNewPassword);

// router.post('/new-password', authController.postNewPassword);

export default router;
