module.exports = function (app) {
    var express = require('express');
    var router = express.Router();

    router.use(function (req, res, next) {
        res.locals.navModule = 'about';
        next();
    });

    router.get('/', function (req, res, next) {
        res.render('about', {
            pageTitle: 'About'
        });
    });

    app.use('/about', router);
    return this;
};