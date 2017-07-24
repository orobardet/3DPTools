'use strict';

module.exports = function (app) {
    const express = require('express');
    const router = express.Router();
    const Controller = app.controllers.setup;
    const User = app.models.user;
    const UserForm = app.forms.user;

    /* setup finished */
    router.get('/done', Controller.done);

    router.use(async (req, res, next) => {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        try {
            if (await User.getActiveUserCount()) {
                return res.redirect('/');
            }
        } catch(err) {
            next();
        }

        res.locals.navModule = 'setup';
        next();
    });

    /* add user */
    router.post('/', UserForm.createUser, Controller.createUser);

    /* setup root */
    router.get('/', Controller.index);

    app.use('/setup', router);

    return this;
};
