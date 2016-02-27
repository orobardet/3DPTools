module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.shop;
    var ShopForm = app.forms.shop;

    router.use(function (req, res, next) {
        res.locals.navModule = 'shop';
        next();
    });

    router.get('/', Controller.index);

    router.post('/add', ShopForm.shop, Controller.addShop);
    router.get('/add', Controller.addShopForm);

    app.use('/shop', router);
    return this;
};
