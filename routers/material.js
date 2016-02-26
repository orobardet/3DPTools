module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.material;

    router.use(function (req, res, next) {
        res.locals.navModule = 'material';
        next();
    });

    router.get('/', Controller.index);

    app.use('/material', router);
    return this;
};
