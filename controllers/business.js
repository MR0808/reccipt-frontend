import { validationResult } from 'express-validator';

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
import generatePassword from '../util/password.js';

export async function getBusinesses(req, res, next) {
    const itemsPerPage = req.session.itemsPerPage || 10;
    const page = +req.query.page || 1;

    try {
        let totalItems = await Business.find().countDocuments();
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        let lowerPage = page - 4; //5
        if (lowerPage < 1) lowerPage = 1; //no
        let upperPage = lowerPage + 9; //14
        if (upperPage > totalPages) upperPage = totalPages; //13
        if (lowerPage < upperPage - 9) lowerPage = 1;
        if (upperPage === totalPages && totalPages > 9) {
            lowerPage = upperPage - 9;
        }
        const businesses = await Business.find({})
            .sort('name')
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .populate('state')
            .populate('country');
        res.render('businesses/businesses', {
            pageTitle: 'Businesses',
            path: '/business/businesses',
            businesses: businesses,
            currentPage: page,
            hasNextPage: itemsPerPage * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            lowerPage: lowerPage,
            upperPage: upperPage,
            results: itemsPerPage
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function setSessionBusinesses(req, res, next) {
    req.session.itemsPerPage = req.query.results;
    return res.status(200).json({ data: req.session.itemsPerPage });
}

export async function getAddBusiness(req, res, next) {
    const countries = await Country.find().sort('name');
    const defaultCountry = await Country.findOne({ name: 'Australia' });
    const states = await State.find({ country: defaultCountry._id });
    res.render('businesses/editBusiness', {
        pageTitle: 'Add Business',
        path: '/business/add-business',
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
            path: '/business/add-business',
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
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 12);
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
            user: newPrimaryContact._id,
            access: 'Admin'
        };
        newBusiness.primaryContact = newPrimaryContact;
        newBusiness.users.push(primaryContactObject);
        await newBusiness.save();
        res.redirect('/businesses');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}
