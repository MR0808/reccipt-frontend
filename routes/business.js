import express from 'express';

import * as businessController from '../controllers/business.js';
import isAuth from '../middleware/is-auth.js';
import * as validators from '../validators/business.js';

const router = express.Router();

router.get('/add-business', isAuth, businessController.getAddBusiness);

router.post(
    '/add-business',
    isAuth,
    ...validators.businessValidation,
    businessController.postAddBusiness
);

export default router;
