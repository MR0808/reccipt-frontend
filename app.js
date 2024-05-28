import path from 'path';
import * as url from 'url';

import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from 'express-session';
import { default as connectMongoDBSession } from 'connect-mongodb-session';
import flash from 'connect-flash';
import multer from 'multer';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import * as errorController from './controllers/error.js';
import AdminUser from './models/adminUser.js';
import slugify from './middleware/slugify.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const MongoDBStore = connectMongoDBSession(session);

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.vuiwnxj.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        const extension = file.mimetype.slice(6, file.mimetype.length);
        cb(null, slugify(req.body.merchantName) + '.' + extension);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

// app.use(
//     helmet.contentSecurityPolicy({
//         useDefaults: true,
//         directives: {
//             'default-src': ["'self'"],
//             'script-src': ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
//             'script-src': ["'self'", "'unsafe-inline'", 'js.stripe.com'],
//             'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
//             'frame-src': ["'self'", 'js.stripe.com'],
//             'font-src': ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com']
//         }
//     })
// );

import mainRoutes from './routes/main.js';
import authRoutes from './routes/auth.js';
import merchantRoutes from './routes/merchant.js';
import optionsRoutes from './routes/options.js';
import configRoutes from './routes/config.js';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    multer({
        storage: fileStorage,
        fileFilter: fileFilter
    }).single('logo')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    session({
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: false,
        store: store
    })
);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    AdminUser.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.use(mainRoutes);
app.use(authRoutes);
app.use('/merchants', merchantRoutes);
app.use('/options', optionsRoutes);
app.use('/config', configRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500'
    });
});

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        app.listen(process.env.PORT || 3000);
    })
    .catch((err) => {
        console.log(err);
    });
