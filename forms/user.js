module.exports = function (app) {
    var form = require('express-form');
    var field = form.field;
    var User = app.models.user;

    this.createUser = form(
        field("email", "Email")
            .trim()
            .required()
            .isEmail()
            .custom(function (email, source, validatorCb) {
                User.count({'email': email}).exec(function (err, count) {
                    if (err) {
                        validatorCb(err);
                    } else if (count) {
                        validatorCb(new Error("Already used"));
                    } else {
                        validatorCb(null);
                    }
                });
            }, "Already used"),
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
    );

    return this;
};