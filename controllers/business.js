import { validationResult } from 'express-validator';
import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import Business from '../models/business.js';
import Merchant from '../models/merchant.js';
import BusinessUser from '../models/businessUser.js';
import MerchantType from '../models/merchantType.js';
import EcomType from '../models/ecomType.js';
import Country from '../models/country.js';
import State from '../models/state.js';
import genAPIKey from '../util/api.js';

export async function getAddBusiness(req, res, next) {
    const countries = await Country.find().sort('name');
    const defaultCountry = await Country.findOne({ name: 'Australia' });
    const states = await State.find({ country: defaultCountry._id });
    res.render('businesses/editBusiness', {
        pageTitle: 'Add Business',
        path: '/merchant/add-business',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        countries: countries,
        states: states,
        business: {
            country: defaultCountry._id.toString()
        }
    });
}

export async function postAddBusiness(req, res, next) {
    let businessForm = req.body;
    businessForm = {
        ...businessForm,
        primaryContact: {
            firstName: businessForm.firstName,
            lastName: businessForm.lastName,
            email: businessForm.userEmail,
            phoneNumber: businessForm.userPhoneNumber
        }
    };
    let errors = [];
    const logo = req.file;
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        const countries = await Country.find().sort('name');
        const states = await State.find({ country: businessForm.country });
        return res.status(422).render('businesses/editBusiness', {
            pageTitle: 'Add Business',
            path: '/merchant/add-business',
            editing: false,
            hasError: true,
            countries: countries,
            states: states,
            business: businessForm,
            validationErrors: errors.array()
        });
    }
    const apiKey = genAPIKey();
    const business = new Business({
        name: businessForm.name,
        phoneNumber: businessForm.phoneNumber,
        genericEmail: businessForm.genericEmail,
        address1: businessForm.address1,
        address2: businessForm.address2,
        suburb: businessForm.suburb,
        postcode: businessForm.postcode,
        state: mongoose.Types.ObjectId.createFromHexString(businessForm.state),
        country: mongoose.Types.ObjectId.createFromHexString(
            businessForm.country
        ),
        abn: businessForm.abn,
        acn: businessForm.acn,
        apiKey: (await apiKey).hashedToken
    });
    try {
        const newBusiness = await business.save();
        const generatePassword = (
            length = 20,
            characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
        ) =>
            Array.from(crypto.randomFillSync(new Uint32Array(length)))
                .map((x) => characters[x % characters.length])
                .join('');
        const hashedPassword = bcrypt.hash(generatePassword, 12);

        const primaryContact = new BusinessUser({
            firstName: businessForm.primaryContact.firstName,
            lastName: businessForm.primaryContact.lastName,
            phoneNumber: businessForm.primaryContact.email,
            email: businessForm.primaryContact.email,
            password: hashedPassword,
            business: {
                business: newBusiness,
                access: 'Admin'
            }
        });
        const newPrimaryContact = await primaryContact.save();
        const primaryContactObject = {
            user: newPrimaryContact,
            access: 'Admin'
        };
        newBusiness.primaryContact = newPrimaryContact;
        newBusiness.users.push(primaryContactObject);
        await newBusiness.save();
        console.log('all done');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}
