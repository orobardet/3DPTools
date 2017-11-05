'use strict';

module.exports = function (app) {
    const express = require('express');
    const router = express.Router();
    const passport = require('passport');
    const LocalStrategy = require('passport-local').Strategy;

    const Controller = app.controllers.app;
    const User = app.models.user;
    const UserForm = app.forms.user;

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        failureFlash: true,
        passReqToCallback: true
    }, (req, username, password, done) => {
        User.findOne({email: username}, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {message: 'Unknown user'});
            }
            if (!user.validPassword(password)) {
                return done(null, false, {message: 'Authentification failed'});
            }
            return done(null, user);
        });
    }));

    // Handle "stay connected" feature, if enabled, in passport auth.
    let sessionKeeperCookieOptions = Controller.$getSessionKeeperCookieOptions(app.get('config'));
    if (sessionKeeperCookieOptions !== false) {

        /*
         * Initialise the remember me strategy, giving it cookie options from config and 2 callbacks:
         *  1. the verify callback, which check if a user exists base on the remember me cookie value
         *  2. a callback to generate a new cookie for remembering the user, if verify callback succeed to indentify a
         *     user: it's recommended to regenerate a fresh token once a previous one was successfully used for auth
         */
        const RememberMeStrategy = require('lib/passport-remember-me').Strategy;
        let {name:cookieName, ...cookieOptions} = sessionKeeperCookieOptions;

        passport.use(new RememberMeStrategy({
                key: cookieName,
                cookie: cookieOptions
            },
            async (req, cookieValue, done) => {
                // The cookie contain a random uniq ID and a random uniq token, separated by a comma (,)
                // The ID must match a user, and the token must match a hash associated to this ID.
                let [id, token] = cookieValue.split(',');
                // Search for a user matching ID and token
                let user = await User.findBySessionKeeperToken(id, token);
                if (user) {
                    // A user was found matching the cookie, it'll be automatically logged in, after some cleaning
                    // Remove the session keeper id used to identify a user. It's secure to consider them as
                    // only one time use
                    user.removeSessionKeeperTokens(id);
                    // Also remove all other tokens for the current "computer"
                    let {userAgent, remoteIp} = Controller.$getUserComputerIdentificationData(req);
                    user.clearSessionKeeperTokens(userAgent, remoteIp);
                    // Save all that in database
                    await user.save();
                    // Return the authenticated user to passport for login finalize
                    return done(null, user);
                }
                // No user found, return it to the Strategy (this is not a fail, just we don't had a chance to
                // remember a user and autologin it, so a standard auth will now occurs)
                return done(null, false)
            },
            async (req, user, done) => {
                // Generate a new token for session keeping for the user, in order to keep autoloading him next time.
                // This mecanisme (delete the used token and generate a new one) is to improve security. It also
                // reset the session keeper (its cookie) life.
                let config = req.app.get('config');
                let {userAgent, remoteIp} = Controller.$getUserComputerIdentificationData(req);
                let {id, token} = user.createSessionKeeperToken(userAgent, remoteIp, config.get('session:stayConnected:expiration'));
                await user.save();
                // Return the new session keeper cookie value to the passport strategy, which will save the cookie
                let cookieValue = id + "," + token;
                return done(null, cookieValue);
            }
        ));

        // Declare the middleware for the remember me passport strategy
        app.use(passport.authenticate('remember-me'));
    }

    /* Generic middleware for all the app routes to set locals for templates:
     * - locale (current language)
     * - flash messages
     * - connected user object, if any
     */
    router.use((req, res, next) => {
        app.locals.moment.locale(req.getLocale());

        res.locals.isUserLogged = req.isAuthenticated();
        if (res.locals.isUserLogged) {
            res.locals.user = req.user;
        }

        res.locals.messages = {
            info: req.flash('info'),
            warning: req.flash('warning'),
            error: req.flash('error'),
            success: req.flash('success'),
        };

        next();
    });

    // For EVERY route of the app, first check if a user is logged in or not
    app.all("*", Controller.isUserLogged);

    // Login/logout routes
    router.get('/login', Controller.needLogin);
    router.post('/login', passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }), Controller.postLogin);
    router.get('/logout', Controller.logout);

    // Account recovery routes
    router.get('/recover-account/:recoveryID/:recoveryToken', Controller.$checkRecoveryToken, Controller.recoverAccount);
    router.post('/recover-account/:recoveryID/:recoveryToken', UserForm.changePassword, Controller.$checkRecoveryToken, Controller.recoverAccountChangePassword);
    router.get('/recover-account', Controller.recoverAccountForm);
    router.post('/recover-account', Controller.recoverAccountSend);

    // Home page
    router.get('/', Controller.index);

    // Javascript locales
    router.get('/locale.js', app.controllers['locale-js'].localeJs);

    // set language
    router.get('/_lang/:lang', Controller.changeLanguage);

    // show user profile
    router.get('/profile', Controller.userProfile);

    // changelog
    router.get('/changelog', Controller.changelog);
    router.get('/change-password', Controller.changePasswordForm);
    router.post('/change-password', UserForm.changePassword, Controller.changePassword);

    // App wise API endpoint to compute nearest predefined color
    // Should be moved in a tool or API router instead
    router.get('/api/color/nearest-predefined/:code', Controller.nearestPredefinedColor);

    app.use('/', router);
};
