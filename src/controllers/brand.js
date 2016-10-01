module.exports = function (app) {
    var when = require('when');
    var Brand = app.models.brand;
    var fs = require('fs');

    this.index = function (req, res, next) {
        when(Brand.find().sort('name').exec())
            .then(function (brands) {
                return res.render('brand/index', {
                    brands: brands,
                    pageTitle: 'Brands',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.add = function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('brand/add', {
                errors: req.form.getErrors()
            });
        }
        var brand = new Brand({
            name: req.form.name,
            url: req.form.url,
        });
        brand.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/brand/set-logo/" + brand.id);
        });
    };

    this.addForm = function (req, res) {
        return res.render('brand/add', {
            errors: []
        });
    };

    this.edit = function (req, res, next) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                if (!req.form.isValid) {
                    return res.render('brand/edit', {
                        brand: brand,
                        errors: req.form.getErrors()
                    });
                }

                brand.name = req.form.name;
                brand.url = req.form.url;

                brand.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/brand");
                });
            });
    };

    this.editForm = function (req, res) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                return res.render('brand/edit', {
                    brand: brand,
                    errors: []
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Brand %s not found.', brandId)
                });
            });
    };

    this.setLogo = function (req, res, next) {
        var brandId = req.params.brand_id;
        var logo = req.file;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                brand.logo.name = logo.originalname;
                brand.logo.size = logo.size;
                brand.logo.mimeType = logo.mimetype;
                brand.logo.data = fs.readFileSync(logo.path);

                fs.unlink(logo.path);

                brand.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/brand");
                });
            });
    };

    this.deleteLogo = function (req, res, next) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                brand.logo = undefined;

                brand.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect("/brand");
                });
            });
    };

    this.logoForm = function (req, res, next) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                return res.render('brand/logo', {
                    brandId: brandId,
                    brand: brand,
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.get = function (req, res) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                var brandData = brand.toObject({getters: false, virtuals: true, versionKey: false});
                return res.json({
                    brand: brandData
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Brand %s not found.', brandId)
                });
            });
    };

    this.getLogo = function (req, res) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).exec())
            .then(function (brand) {
                if (brand.logo) {
                    res.set('Content-Type', brand.logo.mimeType);
                    res.set('Content-Length', brand.logo.size);
                    return res.send(brand.logo.data);
                }
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('Brand %s not found.', brandId)
                });
            });
    };

    this.delete = function (req, res) {
        var brandId = req.params.brand_id;

        when(Brand.findById(brandId).remove().exec())
            .then(function () {
                return res.json({
                    message: res.__('Brand %s successfully deleted.', brandId)
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