module.exports = function (app) {
    var marked = require('marked');

    app.use(function (req, res, next) {
        res.locals.marked = marked;
        next();
    });
};