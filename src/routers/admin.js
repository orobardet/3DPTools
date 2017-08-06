'use strict';

module.exports = function(app) {
    const express = require('express');
    const router = express.Router();
    const Controller = app.controllers.admin;
    const UserForm = app.forms.user;

    router.use((req, res, next) => {
        if (!req.user.isAdmin) {
            let err = new Error('Unauthorized');
            err.status = 401;
            return next(err);
        }
        res.locals.navModule = 'admin';
        next();
    });

    router.all('/', (req, res, next) => {
        return res.redirect(301, '/admin/user');
    });

    router.get('/user', Controller.userIndex);
    router.put('/user/add', UserForm.createUser, Controller.addUser);
    router.get('/user/get/:user_id', Controller.getUser);
    router.post('/user/edit/:user_id', UserForm.editUser, Controller.editUser);
    router.delete('/user/delete/:user_id', Controller.deleteUser);

    router.get('/system-information', Controller.systemInformation);

    router.get('/show-config', Controller.showConfig);

    app.use('/admin', router);

    return this;
};
