import express from 'express';

import * as businessController from '../controllers/business.js';
import isAuth from '../middleware/is-auth.js';
import * as validators from '../validators/business.js';

const router = express.Router();

router.get('/', isAuth, businessController.getBusinesses);

router.get('/add-business', isAuth, businessController.getAddBusiness);

router.post(
    '/add-business',
    isAuth,
    ...validators.businessValidationAdd,
    businessController.postAddBusiness
);

router.get('/business/:slug', isAuth, businessController.getBusiness);

router.get(
    '/edit-business/:businessId',
    isAuth,
    businessController.getEditBusiness
);

router.post(
    '/edit-business',
    isAuth,
    ...validators.businessValidationEdit,
    businessController.postEditBusiness
);

router.get('/add-merchant', isAuth, businessController.getAddMerchant);

router.post(
    '/add-merchant',
    isAuth,
    ...validators.merchantValidationAdd,
    businessController.postAddMerchant
);

router.get(
    '/edit-merchant/:merchantId',
    isAuth,
    businessController.getEditMerchant
);

router.post(
    '/edit-merchant',
    isAuth,
    ...validators.merchantValidationEdit,
    businessController.postEditMerchant
);

router.delete('/remove/:businessId', isAuth, businessController.deleteBusiness);

export default router;
