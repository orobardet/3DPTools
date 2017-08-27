'use strict';

/**
 * List of regexp that must match the request url to allow anonymous (not logged) user to access the page.
 * All page not matching are considered in restricted access and the user is redirected to the login page.
 *
 *  - javascript brower locale access (/locale.js)
 *  - login page (/login)
 *  - setup section (/setup*)
 *  - changelog page (/changelog)
 **/
const gAnonymousAccessAllowed = [
    /^\/locale\.js$/,
    /^\/login$/,
    /^\/setup*/,
    /^\/changelog$/,
    /^\/recover-account$/,
];

module.exports = function (app) {
    const fs = require('fs-promise');
    const Color = require('color');
    const NearestColor = require('lib/nearest-color');

    const User = app.models.user;
    const Shop = app.models.shop;
    const Brand = app.models.brand;
    const Material = app.models.material;
    const Filament = app.models.filament;

    /**
     * Homepage of the application
     *
     * This page some sort of dashboard, and so contains a lot of data and statistics coming from almost every
     * modules of the application.
     */
    this.index = async function (req, res, next) {
        try {
            const config = res.app.get('config');
            const lastUsedCount = config.get("filament:index:lastUsedCount") || 5;
            const almostFinishedThreshold = config.get("filament:index:almostFinishedPercentThreshold") || 25;

            req.setOriginUrl([
                'filament/add',
                'material/add',
                'brand/add',
                'shop/add',
            ], req.originalUrl);

            let shopCount,                      // Number of shops in the database
                brandCount,                     // Number of brands in the database
                materialCount,                  // Number of materials in the database
                randomShop,                     // Pick a random shop from the database
                randomBrand,                    // Pick a random brand from the database
                randomMaterial,                 // Pick a random material from the database
                filamentTotalCount,             // Total number of all filaments in the database
                filamentTotalFinishedCount,     // Number of finished filaments in the database
                filamentTotalUnusedCount,       // Number of unused (not already user = brand new) filaments in the database
                filamentTotalWeight,            // Total weight (in km) of filaments (including used ones) in the database
                filamentTotalLength,            // Total length (in Kg) of filaments (including used ones) in the database
                countPerMaterials,              // Number of filament in the database for each material (array of int)
                lastUsedFilaments,              // List of the ${lastUsedCount} last used filament (array of Filaments)
                almostFinishedFilaments,        // List of the ${lastUsedCount) last filaments below ${almostFinishedThreshold}% left (array of Filaments)
                materials,                      // List of all materials (array of Materials)
                colors;                         // List of all colors (array of objects)

            try {
                // Getting all the data asynchronously
                [
                    shopCount,
                    brandCount,
                    materialCount,
                    randomShop,
                    randomBrand,
                    randomMaterial,
                    filamentTotalCount,
                    filamentTotalFinishedCount,
                    filamentTotalUnusedCount,
                    filamentTotalWeight,
                    filamentTotalLength,
                    countPerMaterials,
                    lastUsedFilaments,
                    almostFinishedFilaments,
                    materials,
                    colors
                ] = await Promise.all([
                    Shop.count().exec(),
                    Brand.count().exec(),
                    Material.count().exec(),
                    Shop.findOneRandom(),
                    Brand.findOneRandom(),
                    Material.findOneRandom(),
                    Filament.count({}).exec(),
                    Filament.count({finished: true}).exec(),
                    Filament.count({materialLeftPercentage: 100}).exec(),
                    Filament.getTotalWeight(),
                    Filament.getTotalLength(),
                    Filament.getCountPerMasterMaterials(true),
                    Filament.find({
                        finished: false,
                        materialLeftPercentage: {$lt: 100}
                    }).sort({lastUsedDate: -1}).limit(lastUsedCount).populate('material brand shop').exec(),
                    Filament.find({
                        finished: false,
                        materialLeftPercentage: {$lt: almostFinishedThreshold}
                    }).sort({materialLeftPercentage: 1}).populate('material brand shop').exec(),
                    Material.find().sort('name').exec(),
                    Filament.getColors()
                ]);
            } catch (err) {
                next(err);
            }

            materials.unshift({name: '&nbsp;', id: null});
            colors.unshift({name: '&nbsp;', code: null});

            return res.render('index', {
                pageTitle: 'Home',
                navModule: 'home',
                shopCount: shopCount,
                brandCount: brandCount,
                materialCount: materialCount,
                randomShop: randomShop,
                randomBrand: randomBrand,
                randomMaterial: randomMaterial,
                filaments: {
                    stats: {
                        totalCount: filamentTotalCount,
                        totalFinishedCount: filamentTotalFinishedCount,
                        totalUnusedCount: filamentTotalUnusedCount,
                        totalWeight: filamentTotalWeight,
                        totalLength: filamentTotalLength,
                        countPerMaterials: countPerMaterials
                    },
                    lastUsed: lastUsedFilaments,
                    almostFinished: almostFinishedFilaments
                },
                materials: materials,
                colors: colors,
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Set a new language
     */
    this.changeLanguage = function (req, res) {
        if (req.params.lang) {
            const lang = req.params.lang,
                config = res.app.get('config');

            if (lang.match(/auto/i)) {
                res.clearCookie(config.get("language:cookieName"));
            } else {
                res.cookie(config.get("language:cookieName"), lang);
            }
        }

        const referrer = req.get('Referrer');
        if (referrer) {
            res.redirect(referrer);
        } else {
            res.redirect('/');
        }
    };

    /**
     * Login page
     */
    this.needLogin = async function (req, res, next) {
        // If a user is aleady logged in, redirect to root page
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        try {
            // If there is no active users, go to setup
            if (!await User.getActiveUserCount()) {
                return res.redirect('/setup');
            }
        } catch(err) {
            return next(err);
        }

        let showForgotPasswordLink = false;
        const mailer = app.get('mailer');
        if (mailer && mailer.isMailerEnabled()) {
            showForgotPasswordLink = true;
        }

        // Show the login form
        res.render('login', {
            showForgotPasswordLink: showForgotPasswordLink,
            pageTitle: 'Login',
            navModule: 'login',
            showNavbar: false
        });
    };

    /**
     * Logout management
     */
    this.logout = function (req, res) {
        req.logout();
        return res.redirect('/');
    };

    /**
     * Middelware checking if any user is logged.
     *
     * If there is no user logged and the requested page is not in the anonymous whitelist, redirect to the
     * login page.
     *
     * Anonymous allowed pages are described in the variable gAnonymousAccessAllowed
     */
    this.isUserLogged = function (req, res, next) {
        for (let pattern of gAnonymousAccessAllowed) {
            if (req.url.match(pattern)) {
                return next();
            }
        }

        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/login');
    };

    this.recoverAccountForm = async function (req, res, next) {
        try {
            const mailer = app.get('mailer');
            if (mailer && mailer.isMailerEnabled()) {
                // Show the account recovery form
                return res.render('account-recovery', {
                    pageTitle: 'Account recovery',
                    navModule: 'login',
                    showNavbar: false
                });
            } else {
                req.flash('warning', 'Account recovery feature is disabled as there is no valid email sending configuration.');
                return res.redirect('/');
            }
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Page showing the profile of the currently logged in user
     */
    this.userProfile = function (req, res) {
        res.render('profile');
    };

    /**
     * Changelog page
     */
    this.changelog = async function (req, res) {
        const changelogFilePath = app.config.get('sourceCode:changelog:filePath');

        let changelog = req.__('No changelog file available.');
        try {
            if (await fs.exists(changelogFilePath)) {
                changelog = await fs.readFile(changelogFilePath, {encoding: 'utf8'});
            }
        } catch(err) {
            // Silent error catching (will show the generic "no changelog file available" message)
        }

        res.render('changelog',  {
            navModule: 'changelog',
            changelog: changelog
        });
    };

    this.nearestPredefinedColor = (req, res, next) => {
        try {
            const predefinedColors = app.get('config').get('filament:colors');

            let normalizedPredefinedColors = {};
            for (let [name, code] of Object.entries(predefinedColors)) {
                let clrConverter = Color(code);
                normalizedPredefinedColors[name] = clrConverter.rgb().array();
            }
            const colorFinder = new NearestColor(normalizedPredefinedColors);

            let clrConverter = Color(req.params.code);
            let nearest = colorFinder.findNearest(clrConverter.rgb().array());
            let nearestCode = false;
            if (nearest) {
                nearestCode = predefinedColors[nearest];
            }

            return res.json({
                name: nearest,
                code: nearestCode
            });
        } catch (err) {
            return next(err);
        }
    };

    return this;
};