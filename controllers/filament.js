module.exports = function (app) {
    var when = require('when');
    var Filament = app.models.filament;
    var Shop = app.models.shop;
    var Brand = app.models.brand;
    var Material = app.models.material;
    var thisController = this;

    this.index = function (req, res, next) {
        when(Filament.find().populate('material brand shop').sort({'material.name': 1, 'color.code': 1, 'brand.name': 1}).exec())
            .then(function (filaments) {
                return res.render('filament/index', {
                    filaments: filaments,
                    pageTitle: 'Filaments',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.add = function (req, res, next) {
        if (!req.form.isValid) {
            return thisController.addForm(req, res, next);
        }

        var filament = new Filament({
            name: req.form.name,
            description: req.form.description,
            brand: req.form.brand,
            material: req.form.material,
            diameter: req.form.diameter,
            color: {
                name: req.form.colorName,
                code: req.form.colorCode
            },
            shop: req.form.shop,
            buyDate: new Date(req.form.buyDate * 1000),
            price: req.form.price,
            density: req.form.density,
            initialMaterialWeight: req.form.initialMaterialWeight,
            initialTotalWeight: req.form.initialTotalWeight,
            materialLeftPercentage: 100
        });
        if (req.form.headTempMin) {
            filament.headTemp.min = req.form.headTempMin;
        }
        if (req.form.headTempMax) {
            filament.headTemp.max = req.form.headTempMax;
        }
        if (req.form.headTempExperienced) {
            filament.headTemp.experienced = req.form.headTempExperienced;
        }
        if (req.form.bedTempMin) {
            filament.bedTemp.min = req.form.bedTempMin;
        }
        if (req.form.bedTempMax) {
            filament.bedTemp.max = req.form.bedTempMax;
        }
        if (req.form.bedTempExperienced) {
            filament.bedTemp.experienced = req.form.bedTempExperienced;
        }
        if (req.form.flowPercentage) {
            filament.flowPercentage = req.form.flowPercentage;
        }
        if (req.form.speedPercentage) {
            filament.speedPercentage = req.form.speedPercentage;
        }
        filament.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/filament");
        });
    };

    this.addForm = function (req, res) {
        when.all([
            Shop.find().sort('name').exec(),
            Brand.find().sort('name').exec(),
            Material.find().sort('name').exec(),
            Filament.find().distinct('color').exec()
        ]).spread(function (shops, brands, materials, usedColors) {
            return res.render('filament/add', {
                shops: shops,
                brands: brands,
                materials: materials,
                usedColors: usedColors,
                predefinedColors: res.app.get('config').get('filament:colors'),
                errors: (req.form) ? req.form.getErrors() : []
            });
        });
    };

    return this;
};