module.exports = function (app) {
    var form = require('express-form');
    var field = form.field;

    this.shop = form(
        field("name", "Name")
            .trim()
            .required()
            .isAlphanumeric(),
        field("url", "Url")
            .trim()
            .isUrl()
    );

    return this;
};