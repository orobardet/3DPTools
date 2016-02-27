module.exports = function (app) {
    var when = require('when');
    var Shop = app.models.shop;
    var fs = require('fs');

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
            return res.redirect("/shop/set-logo/" + shop.id);
        });
    };

    this.addShopForm = function (req, res) {
        return res.render('shop/add', {
            errors: []
        });
    };

    this.setLogo = function (req, res, next) {
        var shopId = req.params.shop_id;
        var logo = req.file;

        when(Shop.findById(shopId).exec())
            .then(function (shop) {
                shop.logo.name = logo.originalname;
                shop.logo.size = logo.size;
                shop.logo.mimeType = logo.mimetype;
                shop.logo.data = fs.readFileSync(logo.path);

                fs.unlink(logo.path);

                shop.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/shop");
                });
            });
    };

    this.deleteLogo = function (req, res, next) {
        var shopId = req.params.shop_id;

        when(Shop.findById(shopId).exec())
            .then(function (shop) {
                shop.logo = undefined;

                shop.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/shop");
                });
            });
    };

    this.logoForm = function (req, res, next) {
        var shopId = req.params.shop_id;

        when(Shop.findById(shopId).exec())
            .then(function (shop) {
                return res.render('shop/logo', {
                    shopId: shopId,
                    shop: shop,
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
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

    this.getLogo = function (req, res) {
        var shopId = req.params.shop_id;

        when(Shop.findById(shopId).exec())
            .then(function (shop) {
                if (shop.logo) {
                    res.set('Content-Type', shop.logo.mimeType);
                    res.set('Content-Length', shop.logo.size);
                    return res.send(shop.logo.data);
                }
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