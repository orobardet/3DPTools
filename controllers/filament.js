module.exports = function (app) {
    var when = require('when');
    var Filament = app.models.filament;
    var Shop = app.models.shop;
    var Brand = app.models.brand;
    var Material = app.models.material;
    var thisController = this;

    this.index = function (req, res, next) {
        when(Filament.find().sort('name').exec())
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
        });
/*        shop.save(function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/shop/set-logo/" + shop.id);
        });
*/
        return res.redirect("/filament");
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