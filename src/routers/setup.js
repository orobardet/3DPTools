module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.setup;
    var User = app.models.user;
    var UserForm = app.forms.user;

    /* setup finished */
    router.get('/done', Controller.done);

    router.use(function (req, res, next) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        User.getActiveUserCount().then(function (count) {
            if (count) {
                return res.redirect('/');
            }
            res.locals.navModule = 'setup';
            next();
        }).catch(function (err) {
            console.error(err);
            next();
        });

    });

    /* add user */
    router.post('/', UserForm.createUser, Controller.createUser);

    /* setup root */
    router.get('/', Controller.index);

    app.use('/setup', router);
    return this;
};
