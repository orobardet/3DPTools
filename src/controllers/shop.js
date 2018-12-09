'use strict';

module.exports = function (app) {
    const Shop = app.models.shop;
    const fs = require('fs-promise');

    /**
     * List of all shops
     */
    this.index = async function (req, res, next) {
        try {
            req.setOriginUrl([
                'shop/add',
                'shop/edit',
                'shop/delete',
            ], req.originalUrl);


            let shops = await Shop.find().sort('name').exec();
            return res.render('shop/index', {
                pageTitle: 'Shops',
                docPath: "shops",
                shops: shops,
                errors: []
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Show the add new shop form
     */
    this.addForm = function (req, res) {
        return res.render('shop/add', {
            pageTitle: 'Add shop',
            docPath: "shops#"+res.__("add-a-shop"),
            cancelUrl: req.getOriginUrl("shop/add", "/shop"),
            errors: []
        });
    };

    /**
     * Add a new shop (process the form shown by `this.addForm`)
     */
    this.add = async function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('shop/add', {
                cancelUrl: req.getOriginUrl("shop/add", "/shop"),
                errors: req.form.getErrors()
            });
        }
        let shop = new Shop({
            name: req.form.name,
            url: req.form.url,
        });

        await shop.save();

        return res.redirect("/shop/set-logo/" + shop.id);
    };

    /**
     * Show the edit shop form
     */
    this.editForm = async function (req, res) {
        let shopId = req.params.shop_id;

        let shop = await Shop.findById(shopId).exec();

        return res.render('shop/edit', {
            pageTitle: 'Edit shop',
            docPath: "shops#"+res.__("edit-a-shop"),
            cancelUrl: req.getOriginUrl("shop/add", "/shop"),
            shop: shop,
            errors: []
        });
    };

    /**
     * Save an edited shop (process the form shown by `this.editForm`)
     */
    this.edit = async function (req, res, next) {
        let shopId = req.params.shop_id;

        let shop = await Shop.findById(shopId).exec();

        if (!req.form.isValid) {
            return res.render('shop/edit', {
                cancelUrl: req.getOriginUrl("shop/add", "/shop"),
                shop: shop,
                errors: req.form.getErrors()
            });
        }

        shop.name = req.form.name;
        shop.url = req.form.url;

        await shop.save();

        return res.redirect("/shop");
    };

    /**
     * Show the change shop logo form
     */
    this.logoForm = async function (req, res, next) {
        let shopId = req.params.shop_id;
        let shop = await Shop.findById(shopId).exec();

        return res.render('shop/logo', {
            pageTitle: "Set shop's picture",
            docPath: "shops#"+res.__("add-a-shop"),
            shopId: shopId,
            shop: shop,
            errors: []
        });
    };

    /**
     * Set the logo for a shop (process the form shown by `this.logoForm`)
     */
    this.setLogo = async function (req, res, next) {
        let shopId = req.params.shop_id;
        let logo = req.file;
        let shop = await Shop.findById(shopId).exec();

        shop.logo.name = logo.originalname;
        shop.logo.size = logo.size;
        shop.logo.mimeType = logo.mimetype;
        shop.logo.data = await fs.readFile(logo.path);

        await fs.unlink(logo.path);

        await shop.save();

        return res.redirect("/shop");
    };

    /**
     * Delete the logo of a shop
     */
    this.deleteLogo = async function (req, res, next) {
        let shopId = req.params.shop_id;
        let shop = await Shop.findById(shopId).exec();

        shop.logo = undefined;

        await shop.save();

        return res.redirect("/shop");
    };

    /**
     * Get shop data
     */
    this.get = async function (req, res) {
        let shopId = req.params.shop_id;
        let shop;

        try {
            shop = await Shop.findById(shopId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Shop %s not found.', shopId)
            });
        }

        let shopData = shop.toObject({getters: false, virtuals: true, versionKey: false});

        return res.json({
            shop: shopData
        });
    };

    /**
     * Get the logo of a shop
     */
    this.getLogo = async function (req, res) {
        let shopId = req.params.shop_id;
        let shop;

        try {
            shop = await Shop.findById(shopId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Shop %s not found.', shopId)
            });
        }

        if (shop.logo) {
            res.set('Content-Type', shop.logo.mimeType);
            res.set('Content-Length', shop.logo.size);

            return res.send(shop.logo.data);
        }
    };

    /**
     * Delete a shop
     */
    this.delete = async function (req, res) {
        let shopId = req.params.shop_id;

        try {
            await Shop.findById(shopId).remove().exec();
        } catch (err) {
            res.status(500);
            return res.json({
                message: res.__(err.message)
            });
        }

        return res.json({
            message: res.__('Shop %s successfully deleted.', shopId)
        });
    };

    return this;
};