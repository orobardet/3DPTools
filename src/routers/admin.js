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

    router.put('/user/add', UserForm.createUser, Controller.addUser);
    router.get('/user/get/:user_id', Controller.getUser);
    router.post('/user/edit/:user_id', UserForm.editUser, Controller.editUser);
    router.delete('/user/delete/:user_id', Controller.deleteUser);

    router.get('/', Controller.adminIndex);

    app.use('/admin', router);

    return this;
};
