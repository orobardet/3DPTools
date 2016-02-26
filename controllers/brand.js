module.exports = function (app) {

    this.index = function (req, res) {
        res.render('brand/index');
    };

    return this;
};