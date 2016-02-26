module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.filament;

    router.use(function (req, res, next) {
        res.locals.navModule = 'filament';
        next();
    });

    router.get('/', Controller.index);

    app.use('/filament', router);
    return this;
};
