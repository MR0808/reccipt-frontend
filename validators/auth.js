import { body, param } from 'express-validator';

import AdminUser from '../models/adminUser.js';

export const signup = [
    body('email')
        .exists({ checkFalsy: true })
        .withMessage('You must type an email')
        .isEmail()
        .withMessage('You must type a proper email')
        .custom((value, { req }) => {
            return AdminUser.findOne({ email: value }).then((userDoc) => {
                if (userDoc) {
                    return Promise.reject(
                        'E-Mail exists already, please pick a different one.'
                    );
                }
            });
        }),
    body(
        'password',
        'The password must be at least 5 chars long and only contain letters and numbers'
    )
        .exists({ checkFalsy: true })
        .withMessage('You must type a password')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .exists({ checkFalsy: true })
        .withMessage('You must type a confirmation password')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('The passwords do not match')
        .trim()
];

export const login = [
    body('email')
        .exists({ checkFalsy: true })
        .withMessage('You must type an email')
        .isEmail()
        .withMessage('You must type a proper email'),
    body('password')
        .exists({ checkFalsy: true })
        .withMessage('You must type a password')
        .trim()
];
