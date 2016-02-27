module.exports = function (app) {
    var when = require('when');
    var Shop = app.models.shop;

    this.index = function (req, res, next) {
        when(Shop.find().sort('name').exec())
            .then(function (shops) {
                return res.render('shop/index', {
                    shops: shops,
                    pageTitle: 'Shops',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.addShop = function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('shop/add', {
                errors: req.form.getErrors()
            });
        }
        var shop = new Shop({
            name: req.form.name,
            url: req.form.url,
        });
        shop.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/shop");
        });
    };

    this.addShopForm = function (req, res) {
        return res.render('shop/add', {
            errors: []
        });
    };

    this.getShop = function (req, res) {
        var shopId = req.params.shop_id;

        when(Shop.findById(shopId).exec())
            .then(function (shop) {
                var shopData = shop.toObject({ getters: false, virtuals: true, versionKey: false });
                return res.json({
                    shop: shopData
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Shop %s not found.', shopId)
                });
            });
    };

    this.deleteShop = function (req, res) {
        var shopId = req.params.shop_id;

        when(Shop.findById(shopId).remove().exec())
            .then(function () {
                return res.json({
                    message: res.__('Shop %s successfully deleted.', shopId)
                });
            })
            .catch(function (err) {
                res.status(500);
                return res.json({
                    message: res.__(err.message)
                });
            });
    };


    return this;
};