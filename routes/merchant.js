import express from 'express';

import * as merchantController from '../controllers/merchant.js';
import isAuth from '../middleware/is-auth.js';
import * as validators from '../validators/merchant.js';

const router = express.Router();

router.get('/add', isAuth, merchantController.getAddMerchant);

router.post(
    '/add-product',
    isAuth,
    ...validators.merchantValidation,
    merchantController.postAddMerchant
);

export default router;
