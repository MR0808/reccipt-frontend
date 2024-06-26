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
    const itemsPerPage = req.query.itemsPerPage || 10;
    const page = req.query.page || 1;
    const search = req.query.s || '';

    try {
        let totalItems;
        let businesses;
        if (search === '') {
            totalItems = await Business.find().countDocuments();
        } else {
            totalItems = await Business.find({
                $text: { $search: search }
            }).countDocuments();
        }
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        let lowerPage = page - 4; //5
        if (lowerPage < 1) lowerPage = 1; //no
        let upperPage = lowerPage + 9; //14
        if (upperPage > totalPages) upperPage = totalPages; //13
        if (lowerPage < upperPage - 9) lowerPage = 1;
        if (upperPage === totalPages && totalPages > 9) {
            lowerPage = upperPage - 9;
        }
        if (search === '') {
            businesses = await Business.find()
                .sort('name')
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .populate('state')
                .populate('country');
        } else {
            businesses = await Business.find({
                $text: { $search: search }
            })
                .sort('name')
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .populate('state')
                .populate('country');
        }
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

export async function getBusiness(req, res, next) {
    const businessSlug = req.params.slug;
    try {
        const business = await Business.findOne({ slug: businessSlug })
            .populate('primaryContact')
            .populate('state', 'isoCode')
            .populate('country', 'name')
            .populate('merchants')
            .populate({
                path: 'merchants',
                populate: { path: 'state', select: 'isoCode' }
            })
            .populate({
                path: 'merchants',
                populate: { path: 'country', select: 'name, isoCode' }
            });

        const users = await BusinessUser.find({
            $or: [
                { 'business.business': business },
                { 'merchants.merchant': { $in: business.merchants } }
            ]
        })
            .sort('lastName firstName')
            .populate({
                path: 'business.business',
                model: 'Business',
                select: 'name'
            })
            .populate({
                path: 'merchants.merchant',
                model: 'Merchant',
                select: 'name'
            });
        res.render('businesses/business-view', {
            pageTitle: business.name,
            path: '/business/business',
            business: business,
            users: users
        });
    } catch (err) {
        console.log(err);
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
        const business = await Business.findById(businessId);
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
            business: business,
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
            const business = await Business.findById(businessId);
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
                merchant: merchantForm,
                business: business
            });
        } catch (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
    }
    const apiKey = genAPIKey();
    const state = mongoose.Types.ObjectId.createFromHexString(
        merchantForm.state
    );
    const country = mongoose.Types.ObjectId.createFromHexString(
        merchantForm.country
    );
    const merchantType = mongoose.Types.ObjectId.createFromHexString(
        merchantForm.merchantType
    );
    const ecomType = mongoose.Types.ObjectId.createFromHexString(
        merchantForm.ecomType
    );
    const primaryContact = mongoose.Types.ObjectId.createFromHexString(
        merchantForm.primaryContact
    );
    const merchant = new Merchant({
        name: merchantForm.name,
        address1: merchantForm.address1,
        address2: merchantForm.address2,
        suburb: merchantForm.suburb,
        postcode: merchantForm.postcode,
        state: state,
        country: country,
        categories: {
            merchantType: merchantType,
            ecomType: ecomType
        },
        abn: merchantForm.abn,
        acn: merchantForm.acn,
        apiKey: (await apiKey).hashedToken,
        logoUrl: logoUrl,
        primaryContact: primaryContact,
        business: merchantForm.businessId
    });
    merchant.users.push({
        user: primaryContact,
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

export async function getEditMerchant(req, res, next) {
    const merchantId = req.params.merchantId;
    try {
        const merchant = await Merchant.findById(merchantId);
        if (!merchant) {
            return res.redirect('/');
        }
        const countries = await Country.find().sort('name');
        const states = await State.find({ country: merchant.country });
        const ecomTypes = await EcomType.find().sort('name');
        const merchantTypes = await MerchantType.find().sort('name');
        const businessUsers = await BusinessUser.find({
            'business.business': merchant.business,
            'business.access': { $in: ['Admin', 'User'] }
        }).sort('lastName');
        const business = await Business.findById(merchant.business);
        res.render('businesses/merchant-edit', {
            pageTitle: 'Edit Merchant',
            path: '/business/edit-merchant',
            editing: true,
            hasError: false,
            validationErrors: [],
            businessId: merchant.business,
            countries: countries,
            states: states,
            ecomTypes: ecomTypes,
            merchantTypes: merchantTypes,
            businessUsers: businessUsers,
            merchant: merchant,
            business: business
        });
    } catch (err) {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function postEditMerchant(req, res, next) {
    const merchantId = req.body.merchantId;
    const businessId = req.body.businessId;
    let merchantForm = req.body;
    const logo = req.file;
    const errors = validationResult(req);
    try {
        const merchant = await Merchant.findById(merchantId);
        merchantForm = {
            ...merchantForm,
            _id: merchantId,
            logoUrl: merchant.logoUrl
        };
        if (!errors.isEmpty()) {
            const countries = await Country.find().sort('name');
            const states = await State.find({
                country: merchantForm.country
            }).sort('name');
            const ecomTypes = await EcomType.find().sort('name');
            const merchantTypes = await MerchantType.find().sort('name');
            const business = await Business.findById(merchant.business);
            return res.status(422).render('businesses/merchant-edit', {
                pageTitle: 'Edit Merchant',
                path: '/business/edit-merchant',
                editing: true,
                hasError: true,
                countries: countries,
                states: states,
                ecomTypes: ecomTypes,
                merchantTypes: merchantTypes,
                merchant: merchantForm,
                businessId: businessId,
                validationErrors: errors.array(),
                business: business
            });
        }
        merchant.name = merchantForm.name;
        merchant.address1 = merchantForm.address1;
        merchant.address2 = merchantForm.address2;
        merchant.suburb = merchantForm.suburb;
        merchant.postcode = merchantForm.postcode;
        merchant.state = mongoose.Types.ObjectId.createFromHexString(
            merchantForm.state
        );
        merchant.country = mongoose.Types.ObjectId.createFromHexString(
            merchantForm.country
        );
        merchant.categories.ecomType =
            mongoose.Types.ObjectId.createFromHexString(merchantForm.ecomType);
        merchant.categories.merchantType =
            mongoose.Types.ObjectId.createFromHexString(
                merchantForm.merchantType
            );
        merchant.abn = merchantForm.abn;
        merchant.acn = merchantForm.acn;
        if (logo) {
            deleteFile(merchant.logoUrl);
            merchant.logoUrl = logo.path.replace('\\', '/');
        }
        await merchant.save();
        res.redirect('/businesses');
    } catch (err) {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}

export async function deleteBusiness(req, res, next) {
    const businessId = req.params.businessId;
    try {
        const business = await Business.findById(businessId);
        if (!business) {
            return next(new Error('Business not found.'));
        }
        business.status = 'Inactive';
        await business.save();
        await Merchant.updateMany(
            { business: business },
            { status: 'Inactive' }
        );
        res.status(200).json({ message: 'Success!' });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
}
