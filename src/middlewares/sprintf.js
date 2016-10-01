module.exports = function (app) {
    var sprintf = require('sprintf-js').sprintf;

    app.use(function (req, res, next) {
        res.locals.sprintf = sprintf;
        next();
    });
};