module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.shop;

    router.use(function (req, res, next) {
        res.locals.navModule = 'shop';
        next();
    });

    router.get('/', Controller.index);

    app.use('/shop', router);
    return this;
};
