module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;

    var Controller = app.controllers.app;
    var User = app.models.user;

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        failureFlash: true,
        passReqToCallback: true
    }, function (req, username, password, done) {
        User.findOne({email: username}, function (err, user) {
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

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    router.use(function (req, res, next) {
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
    }), function (req, res) {
        res.redirect('/');
    });
    router.get('/logout', Controller.logout);

    /* GET home page. */
    router.get('/', Controller.index);

    // set language
    router.get('/_lang/:lang', Controller.changeLanguage);

    // show user profile
    router.get('/profile', Controller.userProfile);

    app.use('/', router);
};
