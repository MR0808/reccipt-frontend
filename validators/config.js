import { body, param } from 'express-validator';

import MerchantType from '../models/merchantType.js';
import EcomType from '../models/ecomType.js';
import slugify from '../middleware/slugify.js';

export const merchantType = [
    body('merchantType')
        .exists({ checkFalsy: true })
        .withMessage('You must type a merchant type')
        .custom(async (value, { req }) => {
            const merchantDoc = await MerchantType.findOne({
                slug: slugify(value)
            });
            if (merchantDoc) {
                return Promise.reject('Merchant type already exists.');
            }
        })
];

export const ecomType = [
    body('ecomType')
        .exists({ checkFalsy: true })
        .withMessage('You must type an ecom type')
        .custom(async (value, { req }) => {
            const ecomDoc = await EcomType.findOne({
                slug: slugify(value)
            });
            if (ecomDoc) {
                return Promise.reject('Ecom type already exists.');
            }
        })
];
