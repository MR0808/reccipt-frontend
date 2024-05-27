import express from 'express';

import * as merchantController from '../controllers/merchant.js';
import isAuth from '../middleware/is-auth.js';

const router = express.Router();

router.get('/add', isAuth, merchantController.getAddMerchant);

export default router;
