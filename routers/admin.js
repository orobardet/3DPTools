module.exports = function (app) {
    var express = require('express');
    var router = express.Router();

    router.use(function (req, res, next) {
        res.locals.navModule = 'admin';
        next();
    });

    router.get('/', function (req, res, next) {
        res.render('admin/index', {
            pageTitle: 'Administration'
        });
    });

    app.use('/admin', router);
    return this;
};
