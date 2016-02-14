module.exports = function (app) {
    var express = require('express');
    var router = express.Router();

    router.get('/', function (req, res, next) {
        res.render('about', {
            pageTitle: 'About',
            navModule: 'about'
        });
    });

    app.use('/about', router);
    return this;
};