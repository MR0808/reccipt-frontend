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
import deleteFile from '../util/file.js';

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
        res.render('businesses/business-list', {
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

export async function getBusiness(req, res, next) {
    const businessSlug = req.params.slug;
    try {
        const business = await Business.findOne({ slug: businessSlug })
            .populate('primaryContact')
            .populate('users')
            .populate('state')
            .populate('country');
        const merchants = await Merchant.find({ business: business._id })
            .populate('state')
            .populate('country');
        console.log(merchants);
        res.render('businesses/business-view', {
            pageTitle: business.name,
            path: '/business/business',
            business: business,
            merchants: merchants
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function getAddBusiness(req, res, next) {
    try {
        const countries = await Country.find().sort('name');
        const defaultCountry = await Country.findOne({ name: 'Australia' });
        const states = await State.find({ country: defaultCountry._id }).sort(
            'name'
        );
        res.render('businesses/business-edit', {
            pageTitle: 'Add Business',
            path: '/business/add-business',
            editing: false,
            hasError: false,
            validationErrors: [],
            countries: countries,
            states: states,
            business: {
                country: defaultCountry._id.toString()
            }
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
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
        try {
            const countries = await Country.find().sort('name');
            const states = await State.find({
                country: businessForm.country
            }).sort('name');
            return res.status(422).render('businesses/business-edit', {
                pageTitle: 'Add Business',
                path: '/business/add-business',
                editing: false,
                hasError: true,
                countries: countries,
                states: states,
                business: businessForm,
                validationErrors: errors.array()
            });
        } catch (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
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
            phoneNumber: businessForm.primaryContact.phoneNumber,
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
        res.redirect('/businesses/business/' + newBusiness.slug);
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function getEditBusiness(req, res, next) {
    const businessId = req.params.businessId;
    try {
        const business = await Business.findById(businessId).populate(
            'primaryContact'
        );
        if (!business) {
            return res.redirect('/');
        }
        const countries = await Country.find().sort('name');
        const states = await State.find({ country: business.country });
        res.render('businesses/business-edit', {
            pageTitle: 'Edit Business',
            path: '/business/edit-business',
            editing: true,
            hasError: false,
            validationErrors: [],
            countries: countries,
            states: states,
            business: business
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function postEditBusiness(req, res, next) {
    const businessId = req.body.businessId;
    let businessForm = req.body;
    businessForm = { ...businessForm, _id: businessId };
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const countries = await Country.find().sort('name');
            const states = await State.find({
                country: businessForm.country
            }).sort('name');
            return res.status(422).render('businesses/business-edit', {
                pageTitle: 'Edit Business',
                path: '/business/edit-business',
                editing: true,
                hasError: true,
                countries: countries,
                states: states,
                business: businessForm,
                validationErrors: errors.array()
            });
        }
        const business = await Business.findById(businessId);
        business.name = businessForm.name;
        business.phoneNumber = businessForm.phoneNumber;
        business.genericEmail = businessForm.genericEmail;
        business.address1 = businessForm.address1;
        business.address2 = businessForm.address2;
        business.suburb = businessForm.suburb;
        business.postcode = businessForm.postcode;
        business.state = mongoose.Types.ObjectId.createFromHexString(
            businessForm.state
        );
        business.country = mongoose.Types.ObjectId.createFromHexString(
            businessForm.country
        );
        business.abn = businessForm.abn;
        business.acn = businessForm.acn;
        await business.save();
        res.redirect('/businesses/business/' + business.slug);
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function getAddMerchant(req, res, next) {
    try {
        const businessId = req.query.business;
        const countries = await Country.find().sort('name');
        const defaultCountry = await Country.findOne({ name: 'Australia' });
        const states = await State.find({ country: defaultCountry._id }).sort(
            'name'
        );
        const ecomTypes = await EcomType.find().sort('name');
        const merchantTypes = await MerchantType.find().sort('name');
        const businessUsers = await BusinessUser.find({
            'business.business': businessId,
            'business.access': { $in: ['Admin', 'User'] }
        }).sort('lastName');
        res.render('businesses/merchant-edit', {
            pageTitle: 'Add Merchant',
            path: '/business/add-merchant',
            editing: false,
            hasError: false,
            validationErrors: [],
            businessId: businessId,
            countries: countries,
            states: states,
            ecomTypes: ecomTypes,
            merchantTypes: merchantTypes,
            businessUsers: businessUsers,
            merchant: {
                country: defaultCountry._id.toString()
            }
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function postAddMerchant(req, res, next) {
    let merchantForm = req.body;
    const businessId = merchantForm.businessId;
    let errorsOld = [];
    const logo = req.file;
    let logoUrl = '';
    errorsOld = validationResult(req);
    let logoError = false;
    if (!logo) {
        logoError = true;
    } else {
        logoUrl = logo.path.replace('\\', '/');
    }
    if (!errorsOld.isEmpty()) {
        let errors = errorsOld.array;
        if (logoError) {
            errors.push({
                type: 'field',
                value: '',
                msg: 'Please add a valid logo (JPG or PNG)',
                path: 'logo',
                location: 'body'
            });
        }
        try {
            const countries = await Country.find().sort('name');
            const states = await State.find({
                country: merchantForm.country
            }).sort('name');
            const ecomTypes = await EcomType.find().sort('name');
            const merchantTypes = await MerchantType.find().sort('name');
            const businessUsers = await BusinessUser.find({
                'business.business': businessId,
                'business.access': { $in: ['Admin', 'User'] }
            }).sort('lastName');
            if (logo) {
                deleteFile(logoUrl);
            }
            res.render('businesses/merchant-edit', {
                pageTitle: 'Add Merchant',
                path: '/business/add-merchant',
                editing: false,
                hasError: true,
                validationErrors: errors,
                businessId: businessId,
                countries: countries,
                states: states,
                ecomTypes: ecomTypes,
                merchantTypes: merchantTypes,
                businessUsers: businessUsers,
                merchant: merchantForm
            });
        } catch (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
    }
    const apiKey = genAPIKey();
    const merchant = new Merchant({
        name: merchantForm.name,
        address1: merchantForm.address1,
        address2: merchantForm.address2,
        suburb: merchantForm.suburb,
        postcode: merchantForm.postcode,
        state: mongoose.Types.ObjectId.createFromHexString(merchantForm.state),
        country: mongoose.Types.ObjectId.createFromHexString(
            merchantForm.country
        ),
        categories: {
            merchantType: mongoose.Types.ObjectId.createFromHexString(
                merchantForm.merchantType
            ),
            ecomType: mongoose.Types.ObjectId.createFromHexString(
                merchantForm.ecomType
            )
        },
        abn: merchantForm.abn,
        acn: merchantForm.acn,
        apiKey: (await apiKey).hashedToken,
        logoUrl: logoUrl,
        primaryContact: mongoose.Types.ObjectId.createFromHexString(
            merchantForm.primaryContact
        ),
        business: merchantForm.businessId
    });
    merchant.users.push({
        user: mongoose.Types.ObjectId.createFromHexString(
            merchantForm.primaryContact
        ),
        access: 'Admin'
    });
    try {
        const newMerchant = await merchant.save();
        const user = await BusinessUser.findById(merchantForm.primaryContact);
        user.merchants.push({ merchant: newMerchant, access: 'Admin' });
        await user.save();
        const business = await Business.findById(businessId);
        business.merchants.push(newMerchant);
        await business.save();
        res.redirect('/businesses');
    } catch (err) {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}
