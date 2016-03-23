module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.setup;

    router.use(function (req, res, next) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }

        User.getActiveUserCount().then(function (count) {
            if (count) {
                return res.redirect('/');
            }
        });

        res.locals.navModule = 'setup';
        next();
    });

    /* add user */
    router.post('/', Controller.createUser);

    /* setup root */
    router.get('/', Controller.index);

    /* setup finished */
    router.get('/done', Controller.done);

    app.use('/setup', router);
    return this;
};
