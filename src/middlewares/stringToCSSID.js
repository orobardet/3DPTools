'use strict';

module.exports = function (app) {
    const marked = require('marked');
    const reInvalidCharacters = /[^a-zA-Z0-9-_]/g;
    const reWordSeparators = /[ \t\n-_]+/g;

    app.use((req, res, next) => {
        res.locals.stringToCSSID = text => {
            return text.toLowerCase().replace(reInvalidCharacters, "").replace(reWordSeparators, "-");
        };
        next();
    });
};