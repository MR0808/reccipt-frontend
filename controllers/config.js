import { validationResult } from 'express-validator';

import MerchantType from '../models/merchantType.js';
import EcomType from '../models/ecomType.js';
import Country from '../models/country.js';
import State from '../models/state.js';
import titleCase from '../util/titlecase.js';

export async function getStates(req, res, next) {
    const states = await State.find({ country: req.query.country });
    return res.status(200).json({ data: states });
}

export async function getMerchantType(req, res, next) {
    try {
        const types = await MerchantType.find().sort('name');
        res.render('config/merchanttype', {
            pageTitle: 'Merchant Types',
            path: '/config/merchanttype',
            hasError: false,
            errorMessage: null,
            validationErrors: [],
            types: types,
            query: req.query
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function postMerchantType(req, res, next) {
    const merchantType = req.body.merchantType;
    if (!merchantType) {
        const types = await MerchantType.find().sort('name');
        return res.status(422).render('config/merchanttype', {
            path: 'config/merchanttype',
            pageTitle: 'Merchant Types',
            errorMessage: 'No merchant type entered',
            hasError: true,
            validationErrors: [],
            query: req.query,
            types: types
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const types = await MerchantType.find().sort('name');
        return res.status(422).render('config/merchanttype', {
            path: 'config/merchanttype',
            pageTitle: 'Merchant Types',
            errorMessage: errors.array()[0].msg,
            hasError: true,
            validationErrors: errors.array(),
            query: req.query,
            types: types
        });
    }
    const type = new MerchantType({
        name: titleCase(merchantType)
    });
    try {
        await type.save();
        res.redirect('/config/merchanttype?added=true');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function getEcomType(req, res, next) {
    try {
        const types = await EcomType.find().sort('name');
        res.render('config/ecomtype', {
            pageTitle: 'Ecom Types',
            path: '/config/ecomtype',
            hasError: false,
            errorMessage: null,
            validationErrors: [],
            types: types,
            query: req.query
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function postEcomType(req, res, next) {
    const ecomType = req.body.ecomType;
    if (!ecomType) {
        const types = await EcomType.find().sort('name');
        return res.status(422).render('config/ecomtype', {
            path: 'config/ecomtype',
            pageTitle: 'Ecom Types',
            errorMessage: 'No ecom type entered',
            hasError: true,
            validationErrors: [],
            query: req.query,
            types: types
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const types = await EcomType.find().sort('name');
        return res.status(422).render('config/ecomtype', {
            path: 'config/ecomtype',
            pageTitle: 'Ecom Types',
            errorMessage: errors.array()[0].msg,
            hasError: true,
            validationErrors: errors.array(),
            query: req.query,
            types: types
        });
    }
    const type = new EcomType({
        name: ecomType
    });
    try {
        await type.save();
        res.redirect('/config/ecomtype?added=true');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}
