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

    router.get('/get/:shop_id', Controller.getShop);

    router.post('/add', ShopForm.shop, Controller.addShop);
    router.get('/add', Controller.addShopForm);

    router.delete('/delete/:shop_id', Controller.deleteShop);

    app.use('/shop', router);
    return this;
};
