'use strict';

module.exports = function (app) {
    const marked = require('marked');

    app.use((req, res, next) => {
        res.locals.marked = marked;
        next();
    });
};