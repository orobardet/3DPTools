module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.admin;
    var UserForm = app.forms.user;

    router.use(function (req, res, next) {
        if (!req.user.isAdmin) {
            var err = new Error('Unauthorized');
            err.status = 401;
            return next(err);
        }
        res.locals.navModule = 'admin';
        next();
    });

    router.put('/user/add', UserForm.createUser, Controller.addUser);

    router.get('/', Controller.adminIndex);

    app.use('/admin', router);
    return this;
};
