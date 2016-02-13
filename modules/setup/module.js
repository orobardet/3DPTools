var express = require('express');
var router = express.Router();
var form = require('express-form');
var field = form.field;

/* add user */
router.post('/', form(
    field("email", "Email")
        .trim()
        .required()
        .isEmail(),
    field("firstname", "Firstname")
        .trim()
        .required()
        .is(/^[a-zA-Z -']+$/),
    field("lastname", "Lastname")
        .trim()
        .is(/^[a-zA-Z -']+$/),
    field("password", "Password")
        .trim()
        .required()
        .is(/^\w{6,}$/),
    field("password2", "Password verification")
        .trim()
        .required()
        .equals("field::password", "Passwords does not match")
), function (req, res, next) {
    if (!req.form.isValid) {
        console.log(req.form.getErrors());
        res.render('setup/index', {
            layout: 'setup/layout',
            errors: req.form.getErrors()
        });
    } else {
        // TODO: save user
        res.redirect("/setup/done");
    }
});

/* setup root */
router.get('/', function (req, res) {
    res.render('setup/index', {
        layout: 'setup/layout',
        errors: [],
        email: null,
        firstname: null,
        lastname: null
    });
});

/* setup finished */
router.get('/done', function (req, res) {
    res.render('setup/done', {
        layout: 'setup/layout'
    });
});

module.exports = {
    rootPath: "/setup",
    "router": router
};
