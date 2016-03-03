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
            .required(),
        field("colorName", "Color name")
            .trim()
            .required(),
        field("colorCode", "Color code")
            .trim()
            .required(),
        field("diameter", "Diameter")
            .trim()
            .required()
            .isFloat(),
        field("buyDate", "Purchase date")
            .trim()
            .required()
            .toInt()
    );

    return this;
};