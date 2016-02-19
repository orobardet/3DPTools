module.exports = function (app) {
    var when = require('when');

    this.adminIndex = function (req, res, next) {
        when(app.models.user.find().sort('name').exec())
            .then(function (users) {
                res.render('admin/index', {
                    users: users,
                    pageTitle: 'Administration',
                    errors: []
                });
            })
            .catch(function (err) {
                next(err);
            });
    };

    this.addUser = function (req, res, next) {

    };

    return this;
};
