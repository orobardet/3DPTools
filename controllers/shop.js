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

    return this;
};