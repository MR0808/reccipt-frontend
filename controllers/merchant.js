import { validationResult } from 'express-validator';

import Merchant from '../models/merchant.js';
import MerchantUser from '../models/merchantUser.js';
import MerchantType from '../models/merchantType.js';
import EcomType from '../models/ecomType.js';
import Country from '../models/country.js';
import State from '../models/state.js';

export async function getAddMerchant(req, res, next) {
    const countries = await Country.find().sort('name');
    const defaultCountry = await Country.findOne({ name: 'Australia' });
    const states = await State.find({ country: defaultCountry._id });
    const ecomTypes = await EcomType.find().sort('name')
    const merchantTypes = await MerchantType.find().sort('name')
    res.render('merchants/editMerchant', {
        pageTitle: 'Add Merchant',
        path: '/merchant/add-merchant',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        countries: countries,
        defaultCountry: defaultCountry._id,
        states: states,
        ecomTypes: ecomTypes,
        merchantTypes: merchantTypes
    });
}
