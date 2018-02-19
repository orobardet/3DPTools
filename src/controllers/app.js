'use strict';

/**
 * List of regexp that must match the request url to allow anonymous (not logged) user to access the page.
 * All page not matching are considered in restricted access and the user is redirected to the login page.
 *
 *  - javascript brower locale access (/locale.js)
 *  - login page (/login)
 *  - setup section (/setup*)
 *  - changelog page (/changelog)
 *  - account recovery (/recover-account*)
 **/
const gAnonymousAccessAllowed = [
    /^\/_lang\/.*/,
    /^\/locale\.js$/,
    /^\/login$/,
    /^\/setup.*/,
    /^\/changelog$/,
    /^\/recover-account.*/,
];

const fs = require('fs-promise');
const Color = require('color');
const NearestColor = require('lib/nearest-color');
const crypto = require('crypto');
const schedule = require('node-schedule');

module.exports = function (app) {

    const User = app.models.user;
    const Shop = app.models.shop;
    const Brand = app.models.brand;
    const Material = app.models.material;
    const Filament = app.models.filament;

    this.asyncPostListeningInit = async function() {
        const debug = require('debug')('3DPTools:asyncInit');

        debug("Setting up scheduled jobs...");
        // Clean expired token account recovery, every day at 23:23
        schedule.scheduleJob('23 23 * * *', () => User.CleanAllExpiredRecovery());
        // Clean expired users' session keeper tokens ("stay connected" feature) every hours at :47
        schedule.scheduleJob('47 * * * *', () => User.CleanAllExpiredSessionKeeperTokens());

        // Run some tasks in //
        debug("Running init tasks...");
        await Promise.all([
            User.CleanAllExpiredRecovery(),
            User.CleanAllExpiredSessionKeeperTokens()
        ]);

        debug("App async init done!");
    };

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
                usedColors;                         // List of all colors (array of objects)

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
                    usedColors
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
                    Material.list({tree: true, locale: res.getLocale()}),
                    Filament.getColors()
                ]);
            } catch (err) {
                next(err);
            }

            const predefinedColors = res.app.get('config').get('filament:colors');
            usedColors = app.controllers.filament.filterPredefinedColors(usedColors, predefinedColors);
            let colors = [];
            for (let [name, code] of Object.entries(predefinedColors)) {
                colors.push({name: name, code: code});
            }
            colors.push(false);
            for (let [name, code] of Object.entries(usedColors)) {
                colors.push({name: name, code: code});
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

        // Check if the "forgot password" feature is enabled and working,
        // which implied if a "forgot password" link should be rendered or not.
        let showForgotPasswordLink = false;
        const mailer = res.app.get('mailer');
        if (mailer && mailer.isMailerEnabled()) {
            showForgotPasswordLink = true;
        }

        // Check if the "stay connected" feature is enabled.
        const config = res.app.get('config');
        let allowStayConnected = (config.get('session:stayConnected:enabled') === true);
        // If there is a stay connected cookie, the "stay connected" option
        // on the login form should be checked
        let preCheckStayConnected = false;
        if (req.cookies[config.get('session:stayConnected:cookieName')]) {
            preCheckStayConnected = true
        }

        // Show the login form
        res.render('login', {
            showForgotPasswordLink: showForgotPasswordLink,
            allowStayConnected: allowStayConnected,
            stayConnectedChecked: preCheckStayConnected,
            pageTitle: 'Login',
            navModule: 'login',
            showNavbar: false
        });
    };


    this.$getUserComputerIdentificationData = (req) => {
        let userComputerData = {};
        userComputerData.userAgent = req.header('user-agent');
        userComputerData.remoteIp = req.header('x-forwarded-for') || req.connection.remoteAddress;

        return userComputerData;
    };


    this.$getSessionKeeperCookieOptions = (config) => {
        if (config.get('session:stayConnected:enabled') !== true) {
            return false;
        }

        let expiration = config.get('session:stayConnected:expiration');

        return {
            name: config.get('session:stayConnected:cookieName'),
            httpOnly: true,
            maxAge: expiration * 60000,
            sameSite: true
        }
    };

    /**
     * When a user has successfully logged in
     *
     * Handle some features like "stay connected"
     */
    this.postLogin = async (req, res, next) => {
        const config = req.app.get('config');
        let sessionKeeperCookieOptions = this.$getSessionKeeperCookieOptions(config);

        // "Stay connected" feature handling, if enabled and asked by the user
        if (sessionKeeperCookieOptions !== false) {
            if (req.body.stayConnected && (req.body.stayConnected === true || req.body.stayConnected === 'on')) {
                // The user asked to stay connected

                // Gather some information
                let {userAgent, remoteIp} = this.$getUserComputerIdentificationData(req);

                // Generate and assign a session keeper token to the user account in database
                let {id, token} = req.user.createSessionKeeperToken(userAgent, remoteIp, config.get('session:stayConnected:expiration'));

                // Put a stay connected cookie containing the session keeper token, for next visits
                let { name:cookieName, ...cookieOpts } = sessionKeeperCookieOptions;
                res.cookie(cookieName, id + "," + token, cookieOpts);

                await req.user.save();
            } else {
                // Remove the stay connected cookie if any, as the user did not want to stay connected anymore
                res.clearCookie(sessionKeeperCookieOptions.name);
                let {userAgent, remoteIp} = this.$getUserComputerIdentificationData(req);
                req.user.clearSessionKeeperTokens(userAgent, remoteIp);

                await req.user.save();
            }
        }

        res.redirect('/');
    };

    /**
     * Logout management
     */
    this.logout = async (req, res) => {
        const config = res.app.get('config');

        if (config.get('session:stayConnected:enabled') === true) {
            // Delete the session keeper cookie
            res.clearCookie(config.get('session:stayConnected:cookieName'));
            // Delete all current session keeper tokens associated to the user in the database
            let {userAgent, remoteIp} = this.$getUserComputerIdentificationData(req);
            req.user.clearSessionKeeperTokens(userAgent, remoteIp);
            await req.user.save();
        }

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

    this.recoverAccountSend = async function (req, res, next) {
        try {
            const mailer = app.get('mailer');
            if (!mailer || !mailer.isMailerEnabled()) {
                return res.redirect('/');
            }

            let user = await User.findOne({email: req.body.email}).exec();

            if (!user) {
                return res.render('account-recovery', {
                    pageTitle: 'Account recovery',
                    navModule: 'login',
                    showNavbar: false,
                    errors: { email: [ 'No user found with this email address.' ]}
                });
            }

            user.generateRecovery(app.get('config').get('accounts:recovery'));
            await user.save();

            const recoveryID = crypto.createHash('sha256').update(user.email).digest('hex');
            const recoveryToken = user.recovery.token;

            const to = `"${user.name}" <${user.email}>`;
            let result = await mailer.sendMail({
                to: to,
                subject: "Account recovery",
                template: "account-recovery.ejs",
                templateData: {
                    recoveryID: recoveryID,
                    recoveryToken: recoveryToken,
                    rootUrl: req.protocol + '://' + req.get('host'),
                    user: user,
                    expirationDate: user.recovery.expiration
                },
                locale: req.getLocale()
            });

            return res.render('account-recovery-sent', {
                pageTitle: 'Account recovery',
                navModule: 'login',
                showNavbar: false
            });
        } catch (err) {
            return next(err);
        }
    };

    this.$checkRecoveryToken = async (req, res, next) => {
        try {
            const recoveryID = req.params.recoveryID;
            const recoveryToken = req.params.recoveryToken;

            // Find the user account to recover using the token
            let user = await User.findOne({'recovery.token': recoveryToken}).exec();
            if (!user) {
                return res.render('account-recovery-error', {
                    message: 'No valid recovery account request found.',
                    pageTitle: 'Account recovery',
                    navModule: 'login',
                    showNavbar: false
                });
            }

            // Check if the ID (hashed email) received match the current user email
            const recoveryIDCheck = crypto.createHash('sha256').update(user.email).digest('hex');
            if (recoveryIDCheck !== recoveryID) {
                return res.render('account-recovery-error', {
                    message: 'No valid recovery account request found.',
                    pageTitle: 'Account recovery',
                    navModule: 'login',
                    showNavbar: false
                });
            }

            // Check if the recovery has not expired
            if (user.recovery.expiration < new Date()) {
                return res.render('account-recovery-expired', {
                    pageTitle: 'Account recovery',
                    navModule: 'login',
                    showNavbar: false
                });
            }

            req.recoveryData = [recoveryID, recoveryToken, user];

            return next();
        } catch (err) {
            return next(err);
        }
    };

    this.recoverAccount = async (req, res, next) => {
        try {
            return res.render('account-recovery-set-password', {
                pageTitle: 'Account recovery',
                navModule: 'login',
                showNavbar: false,
                errors: []
            });
        } catch (err) {
            return next(err);
        }
    };

    this.recoverAccountChangePassword = async (req, res, next) => {
        try {
            if (!req.form.isValid) {
                return res.render('account-recovery-set-password', {
                    pageTitle: 'Account recovery',
                    navModule: 'login',
                    showNavbar: false,
                    errors: req.form.getErrors()
                });
            }

            let [recoveryID, recoveryToken, user] = req.recoveryData;

            user.passwordHash = User.generateHash(req.form.password);
            user.clearRecovery();
            await user.save();

            const mailer = app.get('mailer');
            if (mailer && mailer.isMailerEnabled()) {
                await mailer.sendMail({
                    to: `"${user.name}" <${user.email}>`,
                    subject: "Password changed",
                    template: "password-changed.ejs",
                    templateData: {
                        rootUrl: req.protocol + '://' + req.get('host'),
                        user: user
                    },
                    locale: req.getLocale()
                });
            }

            req.flash('success', 'Password successfully changed.');
            res.redirect("/");

        } catch (err) {
            return next(err);
        }
    };

    /**
     * Page showing the profile of the currently logged in user
     */
    this.userProfile = function (req, res) {
        req.setOriginUrl([
            'change-password',
        ], req.originalUrl);

        return res.render('profile');
    };

    /**
     * Show the page to change the logged user password
     */
    this.changePasswordForm = async (req, res, next) => {
        try {
            return res.render('change-password', {
                cancelUrl: req.getOriginUrl("change-password", "/profile"),
                errors: [],
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Change the logged user password (process the form of `changePasswordForm`)
     */
    this.changePassword = async (req, res, next) => {
        try {
            if (!req.form.isValid) {
                return res.render('change-password', {
                    cancelUrl: req.getOriginUrl("change-password", "/profile"),
                    errors: req.form.getErrors(),
                });
            }

            let user = await User.findById(req.user._id);

            user.passwordHash = User.generateHash(req.form.password);
            await user.save();

            const mailer = app.get('mailer');
            if (mailer && mailer.isMailerEnabled()) {
                await mailer.sendMail({
                    to: `"${user.name}" <${user.email}>`,
                    subject: "Password changed",
                    template: "password-changed.ejs",
                    templateData: {
                        rootUrl: req.protocol + '://' + req.get('host'),
                        user: user
                    },
                    locale: req.getLocale()
                });
            }

            req.flash('success', 'Password successfully changed.');
            res.redirect(req.getOriginUrl("change-password", "/profile"));
        } catch (err) {
            return next(err);
        }
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