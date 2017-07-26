'use strict';

module.exports = function (app) {
    const Brand = app.models.brand;
    const fs = require('fs');

    /**
     * List of all brands
     */
    this.index = async function (req, res, next) {
        let brands;

        try {
            brands = await Brand.find().sort('name').exec();
        } catch (err) {
            return next(err);
        }

        return res.render('brand/index', {
            brands: brands,
            pageTitle: 'Brands',
            errors: []
        });
    };

    /**
     * Show the add new brand form
     */
    this.addForm = function (req, res) {
        return res.render('brand/add', {
            errors: []
        });
    };

    /**
     * Add a new brand (process the form shown by `this.addForm`)
     */
    this.add = async function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('brand/add', {
                errors: req.form.getErrors()
            });
        }
        let brand = new Brand({
            name: req.form.name,
            url: req.form.url,
        });

        try {
            await brand.save();
        } catch (err) {
            return next(err);
        }

        return res.redirect("/brand/set-logo/" + brand.id);
    };

    /**
     * Show the edit brand form
     */
    this.editForm = async function (req, res) {
        let brandId = req.params.brand_id;
        let brand;

        try {
            brand = await Brand.findById(brandId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Brand %s not found.', brandId)
            });
        }

        return res.render('brand/edit', {
            brand: brand,
            errors: []
        });
    };

    /**
     * Save and edited brand (process the form shown by `this.editForm`)
     */
    this.edit = async function (req, res, next) {
        let brandId = req.params.brand_id;

        if (!req.form.isValid) {
            return res.render('brand/edit', {
                brand: brand,
                errors: req.form.getErrors()
            });
        }

        let brand = await Brand.findById(brandId).exec();

        brand.name = req.form.name;
        brand.url = req.form.url;

        try {
            await brand.save();
        } catch (err) {
            return next(err);
        }

        return res.redirect("/brand");
    };

    /**
     * Show the change brand logo form
     */
    this.logoForm = async function (req, res, next) {
        let brandId = req.params.brand_id;
        let brand;

        try {
            brand = await Brand.findById(brandId).exec();
        } catch (err) {
            return next(err);
        }

        return res.render('brand/logo', {
            brandId: brandId,
            brand: brand,
            errors: []
        });
    };

    /**
     * Set the logo for a brand (process the form shown by `this.logoForm`)
     */
    this.setLogo = async function (req, res, next) {
        let brandId = req.params.brand_id;
        let logo = req.file;

        let brand = await Brand.findById(brandId).exec();
        brand.logo.name = logo.originalname;
        brand.logo.size = logo.size;
        brand.logo.mimeType = logo.mimetype;
        brand.logo.data = fs.readFileSync(logo.path);
        fs.unlinkSync(logo.path);

        try {
            await brand.save();
        } catch (err) {
            return next(err);
        }

        return res.redirect("/brand");
    };

    /**
     * Delete the logo of a brand
     */
    this.deleteLogo = async function (req, res, next) {
        let brandId = req.params.brand_id;

        let brand = await Brand.findById(brandId).exec();
        brand.logo = undefined;

        try {
            await brand.save();
        } catch (err) {
            return next(err);
        }

        return res.redirect("/brand");
    };

    /**
     * Get brand data
     */
    this.get = async function (req, res) {
        let brandId = req.params.brand_id;
        let brand;

        try {
            brand = await Brand.findById(brandId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Brand %s not found.', brandId)
            });
        }

        let brandData = brand.toObject({getters: false, virtuals: true, versionKey: false});
        return res.json({
            brand: brandData
        });
    };

    /**
     * Get the logo of a brand
     */
    this.getLogo = async function (req, res) {
        let brandId = req.params.brand_id;
        let brand;

        try {
            brand = await Brand.findById(brandId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('Brand %s not found.', brandId)
            });
        }

        if (brand.logo) {
            res.set('Content-Type', brand.logo.mimeType);
            res.set('Content-Length', brand.logo.size);
            return res.send(brand.logo.data);
        } else {
            res.status(404);
            return res.json();
        }
    };

    /**
     * Delete a brand
     */
    this.delete = async function (req, res) {
        let brandId = req.params.brand_id;

        try {
            if (!await Brand.findById(brandId).remove().exec()) {
                throw new Error(res.__('Error while deleteing brand %s', brandId));
            }
        } catch (err) {
            res.status(500);
            return res.json({
                message: res.__(err.message)
            });
        }

        return res.json({
            message: res.__('Brand %s successfully deleted.', brandId)
        });
    };

    return this;
};