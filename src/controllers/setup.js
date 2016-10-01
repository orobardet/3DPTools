module.exports = function (app) {
    var User = app.models.user;

    this.index = function (req, res) {
        res.render('setup/index', {
            layout: 'setup/layout',
            errors: [],
            email: null,
            firstname: null,
            lastname: null
        });
    };

    this.createUser = function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('setup/index', {
                layout: 'setup/layout',
                errors: req.form.getErrors()
            });
        }

        var user = new User({
            email: req.form.email,
            firstname: req.form.firstname,
            lastname: req.form.lastname,
            passwordHash: User.generateHash(req.form.password),
            isAdmin: true
        });
        user.save(function (err) {
            if (err) {
                next(err);
            } else {
                res.redirect("/setup/done");
            }
        });
    };

    this.done = function (req, res) {
        res.render('setup/done', {
            layout: 'setup/layout'
        });
    };

    return this;
};