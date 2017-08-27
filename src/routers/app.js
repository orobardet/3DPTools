'use strict';

module.exports = function (app) {
    const express = require('express');
    const router = express.Router();
    const passport = require('passport');
    const LocalStrategy = require('passport-local').Strategy;

    const Controller = app.controllers.app;
    const User = app.models.user;

    app.use(passport.initialize());
    app.use(passport.session());

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

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    router.use((req, res, next) => {
        app.locals.moment.locale(req.getLocale());

        res.locals.isUserLogged = req.isAuthenticated();
        if (res.locals.isUserLogged) {
            res.locals.user = req.user;
        }

        res.locals.messages = {
            info: req.flash('info'),
            error: req.flash('error')
        };

        next();
    });

    app.all("*", Controller.isUserLogged);

    router.get('/login', Controller.needLogin);
    router.post('/login', passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }), (req, res) => {
        res.redirect('/');
    });
    router.get('/logout', Controller.logout);

    router.get('/recover-account', Controller.recoverAccountForm);

    /* GET home page. */
    router.get('/', Controller.index);

    // Javascript locales
    router.get('/locale.js', app.controllers['locale-js'].localeJs);

    // set language
    router.get('/_lang/:lang', Controller.changeLanguage);

    // show user profile
    router.get('/profile', Controller.userProfile);

    // changelog
    router.get('/changelog', Controller.changelog);

    router.get('/api/color/nearest-predefined/:code', Controller.nearestPredefinedColor);

    app.use('/', router);
};
