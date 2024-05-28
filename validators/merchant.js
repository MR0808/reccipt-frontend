import { body, param } from 'express-validator';

import Merchant from '../models/merchant.js';
import MerchantUser from '../models/merchantUser.js';
import slugify from '../middleware/slugify.js';

export const merchantValidation = [
    body('merchantName', 'Please enter a merchant name')
        .exists({ checkFalsy: true })
        .isString()
        .custom(async (value, { req }) => {
            const merchantDoc = await Merchant.findOne({
                slug: slugify(value)
            });
            if (merchantDoc) {
                return Promise.reject('Merchant already exists.');
            }
        })
        .trim(),
    body('tradingName').trim(),
    body('genericEmail', 'Please enter a valid merchant email')
        .exists({ checkFalsy: true })
        .isEmail(),
    body('phoneNumber', 'Please enter a phone number')
        .exists({
            checkFalsy: true
        })
        .custom((value) => {
            if (value.length !== 10) {
                return Promise.reject('Phone number should be 10 digits');
            } else {
                return true;
            }
        })
        .trim(),
    body('address1', 'Please enter an address line 1')
        .exists({ checkFalsy: true })
        .trim(),
    body('address2').trim(),
    body('suburb', 'Please enter a suburb').exists({ checkFalsy: true }).trim(),
    body('postcode', 'Please enter a postcode')
        .exists({ checkFalsy: true })
        .trim(),
    body('abn', 'Please enter an ABN').exists({ checkFalsy: true }).trim(),
    body('acn', 'Please enter an ACN').exists({ checkFalsy: true }).trim(),
    body('firstName', 'Please enter a primary contact first name')
        .exists({ checkFalsy: true })
        .trim(),
    body('lastName', 'Please enter a primary contact last name')
        .exists({ checkFalsy: true })
        .trim(),
    body('userEmail', 'Please enter a valid primary contact email')
        .exists({ checkFalsy: true })
        .isEmail(),
    body('userPhoneNumber', 'Please enter a primary contact phone number')
        .exists({
            checkFalsy: true
        })
        .custom((value) => {
            if (value.length !== 10) {
                return Promise.reject('Phone number should be 10 digits');
            } else {
                return true;
            }
        })
        .trim()
];
