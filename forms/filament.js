module.exports = function (app) {
    var form = require('express-form');
    var field = form.field;

    this.filament = form(
        field("name", "Name")
            .trim()
            .required(),
        field("description", "Description")
            .trim(),
        field("material", "Material")
            .required(),
        field("brand", "Brand")
            .required(),
        field("shop", "Shop")
            .required()

    );

    return this;
};