import { validationResult } from 'express-validator';
import crypto from 'crypto';

import bcrypt from 'bcryptjs';

import Business from '../models/business.js';
import Merchant from '../models/merchant.js';
import BusinessUser from '../models/businessUser.js';
import MerchantType from '../models/merchantType.js';
import EcomType from '../models/ecomType.js';
import Country from '../models/country.js';
import State from '../models/state.js';

export async function getAddMerchant(req, res, next) {
    const countries = await Country.find().sort('name');
    const defaultCountry = await Country.findOne({ name: 'Australia' });
    const states = await State.find({ country: defaultCountry._id });
    const ecomTypes = await EcomType.find().sort('name');
    const merchantTypes = await MerchantType.find().sort('name');
    res.render('merchants/editMerchant', {
        pageTitle: 'Add Merchant',
        path: '/merchant/add-merchant',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        countries: countries,
        states: states,
        ecomTypes: ecomTypes,
        merchantTypes: merchantTypes,
        merchant: {
            country: defaultCountry._id.toString()
        }
    });
}

export async function postAddMerchant(req, res, next) {
    let merchantForm = req.body;
    merchantForm = {
        ...merchantForm,
        primaryContact: {
            firstName: merchantForm.firstName,
            lastName: merchantForm.lastName,
            email: merchantForm.userEmail,
            phoneNumber: merchantForm.userPhoneNumber
        }
    };
    let errors = [];
    const logo = req.file;
    if (!logo) {
        const countries = await Country.find().sort('name');
        const states = await State.find({ country: merchantForm.country });
        const ecomTypes = await EcomType.find().sort('name');
        const merchantTypes = await MerchantType.find().sort('name');
        errors = [{ msg: 'Attached file is not an image.' }];
        console.log(errors);
        return res.status(422).render('merchants/editMerchant', {
            pageTitle: 'Add Merchant',
            path: '/merchant/add-merchant',
            errorMessage: errors,
            editing: false,
            hasError: true,
            countries: countries,
            states: states,
            ecomTypes: ecomTypes,
            merchantTypes: merchantTypes,
            merchant: merchantForm,
            validationErrors: []
        });
    }
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        const countries = await Country.find().sort('name');
        const states = await State.find({ country: merchantForm.country });
        const ecomTypes = await EcomType.find().sort('name');
        const merchantTypes = await MerchantType.find().sort('name');
        return res.status(422).render('merchants/editMerchant', {
            pageTitle: 'Add Merchant',
            path: '/merchant/add-merchant',
            errorMessage: errors.array(),
            editing: false,
            hasError: true,
            countries: countries,
            states: states,
            ecomTypes: ecomTypes,
            merchantTypes: merchantTypes,
            merchant: merchantForm,
            validationErrors: errors.array()
        });
    }
    const logoUrl = logo.path.replace('\\', '/');
    if (!merchantForm.tradingName) {
        merchantForm.tradingName = merchantForm.merchantName;
    }
    const merchant = new Merchant({
        merchantName: merchantForm.merchantName,
        tradingName: merchantForm.tradingName,
        phoneNumber: merchantForm.phoneNumber,
        genericEmail: merchantForm.genericEmail,
        address1: merchantForm.address1,
        address2: merchantForm.address2,
        suburb: merchantForm.suburb,
        postcode: merchantForm.postcode,
        state: mongoose.Types.ObjectId(merchantForm.state),
        country: mongoose.Types.ObjectId(merchantForm.country),
        logoUrl: logoUrl,
        abn: merchantForm.abn,
        acn: merchantForm.acn,
        categories: {
            merchantType: mongoose.Types.ObjectId(merchantForm.merchantType),
            eComType: mongoose.Types.ObjectId(merchantForm.eComType)
        }
    });
    const newMerchant = await merchant.save();
    const generatePassword = (
        length = 20,
        characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
    ) =>
        Array.from(crypto.randomFillSync(new Uint32Array(length)))
            .map((x) => characters[x % characters.length])
            .join('');
    const hashedPassword = bcrypt.hash(generatePassword, 12);
    const checkPrimary = await MerchantUser.findOne({
        email: merchantForm.primaryContact.email
    });
    if (checkPrimary) {
        newMerchant.primaryContact = checkPrimary;
        await newMerchant.save();
    } else {
        const primaryContact = new MerchantUser({
            firstName: merchantForm.primaryContact.firstName,
            lastName: merchantForm.primaryContact.lastName,
            phoneNumber: merchantForm.primaryContact.email,
            email: merchantForm.primaryContact.email,
            password: hashedPassword,
            type: 'Admin',
            merchant: newMerchant
        });
        const newPrimaryContact = await primaryContact.save();
        newMerchant.primaryContact = newPrimaryContact;
        await newMerchant.save();
    }
}
