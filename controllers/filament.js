module.exports = function (app) {
    var when = require('when');
    var Filament = app.models.filament;
    var Shop = app.models.shop;
    var Brand = app.models.brand;
    var Material = app.models.material;

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
        /*
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
         */
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
                errors: []
            });
        });
    };

    return this;
};