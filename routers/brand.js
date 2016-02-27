module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.brand;

    router.use(function (req, res, next) {
        res.locals.navModule = 'brand';
        next();
    });

    router.get('/', Controller.index);

    app.use('/brand', router);
    return this;
};
