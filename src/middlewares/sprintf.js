'use strict';

module.exports = function (app) {
    const sprintf = require('sprintf-js').sprintf;

    app.use((req, res, next) => {
        res.locals.sprintf = sprintf;
        next();
    });
};