import express from 'express';

import * as configController from '../controllers/config.js';
import * as validators from '../validators/config.js';
import isAuth from '../middleware/is-auth.js';

const router = express.Router();

router.get('/merchanttype', isAuth, configController.getMerchantType);

router.post(
    '/merchanttype',
    isAuth,
    ...validators.merchantType,
    configController.postMerchantType
);

router.get('/ecomtype', isAuth, configController.getEcomType);

router.post(
    '/ecomtype',
    isAuth,
    ...validators.ecomType,
    configController.postEcomType
);

export default router;
